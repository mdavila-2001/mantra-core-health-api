import { ACTIVE_BOOKING_STATES } from '../../../domain/booking/booking-states';
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
import { SchedulingErrorReason } from '../../../scheduling.error-reasons';

/** Retira una plantilla (retiro lógico). */
@Injectable()
export class RetireTemplateUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly catalogRepo: SchedulingCatalogRepository,
    private readonly access: CatalogAccess,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(RetireTemplateUseCase.name);
  }

  async execute(
    templateId: string,
    actor: AuthenticatedUser,
  ): Promise<RetireTemplateResponseDto> {
    this.logger.info(
      { operation: 'scheduling.template.retire', templateId },
      'Retiring schedule template',
    );

    return this.em.transactional(async (tx) => {
      const template = await this.catalogRepo.findTemplateById(tx, templateId);
      if (!template) {
        throw new ResourceNotFoundException(
          'Plantilla no encontrada',
          {
            templateId,
          },
          SchedulingErrorReason.TEMPLATE_NOT_FOUND,
        );
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
          SchedulingErrorReason.TEMPLATE_RESOURCE_NOT_FOUND,
        );
      }
      this.access.assertActorResource(resource, actor);

      const bookings = await this.catalogRepo.findBookingsOfTemplate(
        tx,
        templateId,
        ACTIVE_BOOKING_STATES,
        MAX_BOOKINGS_IN_NOTICE,
      );

      // M4 · H1.S2.M2: las citas VIVAS ya no frenan el retiro. Un médico en
      // ejercicio siempre tiene citas confirmadas, así que el 409 le impedía
      // cambiar su horario nunca — y el retiro ya conservaba los cupos con una
      // cita detrás (`keptSlots`): la cita confirmada sigue en su cupo, que no
      // se suelta ni se borra. Lo que cambia es que ahora corre, y la
      // respuesta dice cuáles citas siguen vivas para que la pantalla las
      // muestre. Contrato fijado por el CA del encargo de M4 (2026-09-26).
      const withdrawal = await this.catalogRepo.retireTemplate(
        tx,
        templateId,
        CONCEPTS.TEMPLATE_RETIRED,
        actor.id,
      );

      // Con citas vivas, la muestra que devuelve el repositorio es de VIVAS.
      const live = bookings.live > 0 ? bookings.sample : [];
      return {
        id: templateId,
        statusConceptId: CONCEPTS.TEMPLATE_RETIRED,
        releasedSlots: withdrawal.releasedSlots,
        keptSlots: withdrawal.keptSlots,
        liveBookings: bookings.live,
        // Los ids y no los nombres: quien recibe esto es la pantalla, que
        // ya sabe pedir cada cita con su permiso. Mandar nombres acá
        // filtraría pacientes a cualquiera que administre agendas.
        liveBookingIds: live.map((booking) => booking.id),
        truncated: bookings.live > live.length,
      };
    });
  }
}
