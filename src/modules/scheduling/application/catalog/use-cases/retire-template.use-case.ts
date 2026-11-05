import { ACTIVE_BOOKING_STATES } from '../../../domain/booking/booking-states';
import {
  BlockedBookingsCanceller,
  SCHEDULE_CHANGE_CANCELLATION_REASON,
  type CancelledByBlock,
} from '../support/blocked-bookings-canceller';
import {
  CONCEPTS,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../../../common';
import { CatalogAccess } from '../support/catalog-access';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { MAX_BOOKINGS_IN_NOTICE } from '../../../domain/catalog/catalog-concepts';
import { PinoLogger } from 'nestjs-pino';
import { RetireTemplateResponseDto } from '../../../presentation/dto';
import { SchedulingCatalogRepository } from '../../../infrastructure/repositories';

/** Qué hacer con las citas vivas al retirar el horario. */
export interface RetireTemplateOptions {
  /**
   * `true`: cancela cada cita viva con el motivo «cambio de horario» y le
   * avisa al paciente, en la misma transacción del retiro. `false` (el valor
   * de siempre): el retiro las conserva y las informa en `liveBookings`.
   */
  readonly cancelAffectedBookings: boolean;
}

/** Retira una plantilla (retiro lógico). */
@Injectable()
export class RetireTemplateUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly catalogRepo: SchedulingCatalogRepository,
    private readonly access: CatalogAccess,
    private readonly blockedBookings: BlockedBookingsCanceller,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(RetireTemplateUseCase.name);
  }

  /**
   * Retira el horario y, sólo si el profesional lo pidió, cancela sus citas.
   *
   * ## Dos contratos, los dos a propósito
   *
   * - **Por omisión conserva las citas** (M4 · H1.S2.M2, 26/09/2026): un médico
   *   en ejercicio siempre tiene citas confirmadas, y frenarlo con 409 lo
   *   dejaba sin poder cambiar su horario nunca. Eso no cambia.
   * - **Con `cancelAffectedBookings`** (pedido del propietario, 24/10/2026:
   *   «cambiar horario → cancelación con aviso al paciente»): cada cita viva
   *   se cancela por el mismo camino que una cancelación a mano, con el motivo
   *   «cambio de horario de atención», y el aviso sale después del commit. La
   *   pantalla le muestra antes a quién alcanza (`templates/:id/live-bookings`)
   *   y le deja elegir: cancelar y avisar, o conservar.
   *
   * Un paciente ya recibido no se cancela por acá (422), igual que al bloquear.
   */
  async execute(
    templateId: string,
    actor: AuthenticatedUser,
    options: RetireTemplateOptions = { cancelAffectedBookings: false },
  ): Promise<RetireTemplateResponseDto> {
    this.logger.info(
      {
        operation: 'scheduling.template.retire',
        templateId,
        cancelAffectedBookings: options.cancelAffectedBookings,
      },
      'Retiring schedule template',
    );

    let cancelled: readonly CancelledByBlock[] = [];

    const retired = await this.em.transactional(async (tx) => {
      const template = await this.catalogRepo.findTemplateById(tx, templateId);
      if (!template) {
        throw new ResourceNotFoundException('Plantilla no encontrada', {
          templateId,
        });
      }
      const resource = await this.catalogRepo.findResourceById(
        tx,
        template.resourceId,
      );
      if (!resource) {
        throw new ResourceNotFoundException(
          'Recurso de la plantilla no encontrado',
          {
            resourceId: template.resourceId,
          },
        );
      }
      this.access.assertActorResource(resource, actor);

      if (options.cancelAffectedBookings) {
        // Cancela citas y avisa a pacientes: dueño de la agenda, o de su
        // organización — no cualquier administrador de agenda.
        this.access.assertMayReadAgendaBookings(resource, actor);
        const slots = await this.catalogRepo.findSlotsOfTemplateForUpdate(
          tx,
          templateId,
        );
        const affected = await this.blockedBookings.describe(tx, slots);
        this.blockedBookings.assertNobodyPresent(
          affected.present,
          template.resourceId,
        );
        if (affected.cancellable.length > 0) {
          cancelled = await this.blockedBookings.cancelAll(
            tx,
            affected.cancellable,
            actor,
            SCHEDULE_CHANGE_CANCELLATION_REASON,
          );
          await tx.flush();
        }
      }

      const bookings = await this.catalogRepo.findBookingsOfTemplate(
        tx,
        templateId,
        ACTIVE_BOOKING_STATES,
        MAX_BOOKINGS_IN_NOTICE,
      );

      const withdrawal = await this.catalogRepo.retireTemplate(
        tx,
        templateId,
        CONCEPTS.TEMPLATE_RETIRED,
        actor.id,
        // Los cupos que sostienen una cita se conservan cerrados: siguen con
        // su paciente, pero el horario retirado no los vuelve a ofrecer (P23).
        CONCEPTS.SLOT_BLOCKED,
      );

      const live = bookings.live > 0 ? bookings.sample : [];
      return {
        id: templateId,
        statusConceptId: CONCEPTS.TEMPLATE_RETIRED,
        releasedSlots: withdrawal.releasedSlots,
        keptSlots: withdrawal.keptSlots,
        liveBookings: bookings.live,
        liveBookingIds: live.map((booking) => booking.id),
        truncated: bookings.live > live.length,
        cancelledBookings: cancelled.length,
      };
    });

    await this.blockedBookings.announce(cancelled);
    return retired;
  }
}
