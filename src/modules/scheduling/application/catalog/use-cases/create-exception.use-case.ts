import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../../../common';
import {
  BlockedBookingsCanceller,
  blockCancellationReason,
  type CancelledByBlock,
} from '../support/blocked-bookings-canceller';
import {
  CreateExceptionDto,
  ExceptionResponseDto,
} from '../../../presentation/dto';
import {
  EXCEPTION_TYPE_CONCEPT,
  REASON_REQUIRING_TEXT,
} from '../../../domain/catalog/catalog-concepts';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { PRACTITIONER_PROFILE_TABLES } from '../../../domain/resource/practitioner-profile-tables';
import { PinoLogger } from 'nestjs-pino';
import { SchedulingCatalogRepository } from '../../../infrastructure/repositories';
import { SchedulingProfessionalTimeService } from '../../professional-time/scheduling-professional-time.service';

/** UC-41-04: registra una excepción de disponibilidad. */
@Injectable()
export class CreateExceptionUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly catalogRepo: SchedulingCatalogRepository,
    private readonly professionalTime: SchedulingProfessionalTimeService,
    private readonly blockedBookings: BlockedBookingsCanceller,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CreateExceptionUseCase.name);
  }

  /**
   * Bloquea un rato y, si el profesional lo confirmó, cancela las citas que
   * ese rato tenía — avisando a cada paciente después del commit.
   *
   * ## Lo que cambió el 24/10/2026
   *
   * Antes, una cita confirmada en el rango frenaba el bloqueo con 422
   * («Reprográmela primero»). El propietario pidió que el bloqueo **cancele y
   * avise**, y que el profesional vea antes a quién deja sin cita. Ver
   * `BlockedBookingsCanceller` para los dos pasos.
   *
   * ## Lo que NO cambió
   *
   * - Una cita confirmada del mismo profesional **en otra sede** sigue
   *   frenando con 422: no es de esta agenda, y cancelarla desde acá sería
   *   decidir por otra agenda.
   * - Un paciente ya recibido en recepción no se cancela por bloqueo.
   * - La atención extraordinaria (`isAvailable`) no toca ninguna cita.
   */
  async execute(
    resourceId: string,
    dto: CreateExceptionDto,
    actor: AuthenticatedUser,
  ): Promise<ExceptionResponseDto> {
    // «Otro» sin explicación no dice nada. Se comprueba en el servidor y no
    // sólo en el formulario: la regla es del catálogo, no de la pantalla.
    if (
      dto.exceptionType === REASON_REQUIRING_TEXT &&
      (dto.reason === undefined || dto.reason.trim() === '')
    ) {
      throw new PreconditionFailedException(
        'Eligió «Otro» como motivo: escriba cuál es',
        { resourceId, exceptionType: dto.exceptionType },
      );
    }

    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    if (startAt >= endAt) {
      throw new PreconditionFailedException(
        'La excepción debe empezar antes de terminar',
        {
          resourceId,
        },
      );
    }

    this.logger.info(
      {
        operation: 'scheduling.exception.create',
        resourceId,
        type: dto.exceptionType,
        cancelAffectedBookings: dto.cancelAffectedBookings === true,
      },
      'Registering availability exception',
    );

    let cancelled: readonly CancelledByBlock[] = [];

    const created = await this.em.transactional(async (tx) => {
      const resource = await this.catalogRepo.findResourceById(tx, resourceId);
      if (!resource) {
        throw new ResourceNotFoundException('Recurso no encontrado', {
          resourceId,
        });
      }

      const isAvailable = dto.isAvailable ?? false;

      if (
        !isAvailable &&
        PRACTITIONER_PROFILE_TABLES.includes(resource.resourceRefType)
      ) {
        cancelled = await this.cancelBookingsOfBlock(
          tx,
          resource.resourceRefId,
          resourceId,
          startAt,
          endAt,
          dto,
          actor,
        );
      }

      const exception = this.catalogRepo.createException(tx, {
        resourceId,
        exceptionTypeConceptId: EXCEPTION_TYPE_CONCEPT[dto.exceptionType],
        startAt,
        endAt,
        reason: dto.reason,
        isAvailable,
        actorUserId: actor.id,
      });

      let blockedSlots = 0;
      if (!isAvailable) {
        const overlapping = await this.catalogRepo.findOpenSlotsInWindow(
          tx,
          resourceId,
          startAt,
          endAt,
        );
        for (const slot of overlapping) {
          const untouched = slot.remainingCapacity === slot.capacity;
          if (slot.statusConceptId === CONCEPTS.SLOT_OPEN && untouched) {
            slot.statusConceptId = CONCEPTS.SLOT_BLOCKED;
            touch(slot, actor.id);
            blockedSlots += 1;
          }
        }
      }

      return {
        id: exception.id,
        blockedSlots,
        cancelledBookings: cancelled.length,
      };
    });

    // Después del commit, como todos los avisos del módulo: si el bloqueo no
    // se escribió, nadie recibe «su cita se canceló».
    await this.blockedBookings.announce(cancelled);
    return created;
  }

  /**
   * Las citas de ESTA agenda en el rango: vista previa o cancelación, según
   * `cancelAffectedBookings`. Las de otras sedes del mismo profesional frenan
   * con el 422 de siempre (AG-3).
   */
  private async cancelBookingsOfBlock(
    tx: EntityManager,
    practitionerProfileId: string,
    resourceId: string,
    startAt: Date,
    endAt: Date,
    dto: CreateExceptionDto,
    actor: AuthenticatedUser,
  ): Promise<readonly CancelledByBlock[]> {
    const slots = await this.catalogRepo.findSlotsOverlappingForUpdate(
      tx,
      resourceId,
      startAt,
      endAt,
    );
    const affected = await this.blockedBookings.describe(tx, slots);
    this.blockedBookings.assertNobodyPresent(affected.present, resourceId);

    const ownBookingIds = new Set(affected.cancellable.map((b) => b.bookingId));
    const elsewhere = (
      await this.professionalTime.confirmedBookings(
        tx,
        practitionerProfileId,
        startAt,
        endAt,
      )
    ).filter((commitment) => !ownBookingIds.has(commitment.id));
    if (elsewhere.length > 0) {
      const first = elsewhere[0];
      throw new PreconditionFailedException(
        `Tiene una cita confirmada en ese rato${
          first.resourceName ? ` en «${first.resourceName}»` : ''
        }. Reprográmela primero o elija otro horario.`,
        {
          bookingId: first.id,
          startAt: first.startAt,
          endAt: first.endAt,
        },
      );
    }

    this.blockedBookings.assertConfirmed(
      affected.cancellable,
      dto.cancelAffectedBookings,
    );
    if (affected.cancellable.length === 0) return [];

    const cancelled = await this.blockedBookings.cancelAll(
      tx,
      affected.cancellable,
      actor,
      blockCancellationReason(dto.exceptionType, dto.reason),
    );
    // Los cupos de las citas canceladas volvieron a OPEN en memoria; se
    // escriben antes de buscar qué bloquear, para que el bloqueo los alcance.
    await tx.flush();
    return cancelled;
  }
}
