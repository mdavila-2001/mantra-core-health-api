import { ACTIVE_BOOKING_STATES } from '../../../domain/booking/booking-states';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../../../common';
import {
  BOOKING_HISTORY_PORT,
  type BookingHistoryPort,
} from '../../ports/booking-history.port';
import { BookingAccess } from '../support/booking-access';
import { BookingChangeNotifier } from '../support/booking-change-notifier';
import type { BookingTransitionSnapshot } from '../../../domain/booking/booking-transition';
import { EntityManager } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';
import { PRACTITIONER_PROFILE_TABLES } from '../../../domain/resource/practitioner-profile-tables';
import { PinoLogger } from 'nestjs-pino';
import {
  RescheduleBookingDto,
  RescheduleResponseDto,
} from '../../../presentation/dto';
import { SCHED } from '../../../domain/scheduling.concepts';
import {
  SchedulingBookingsRepository,
  SchedulingCatalogRepository,
} from '../../../infrastructure/repositories';
import { SchedulingProfessionalTimeService } from '../../professional-time/scheduling-professional-time.service';
import { actorKindOf } from '../../../domain/booking/agenda-actors';
import { requireReason } from '../support/require-reason';
import { SchedulingErrorReason } from '../../../scheduling.error-reasons';

/** UC-41-08: mueve la cita a otro slot, liberando el cupo del original. */
@Injectable()
export class RescheduleBookingUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly bookingsRepo: SchedulingBookingsRepository,
    private readonly catalogRepo: SchedulingCatalogRepository,
    private readonly professionalTime: SchedulingProfessionalTimeService,
    private readonly access: BookingAccess,
    @Inject(BOOKING_HISTORY_PORT)
    private readonly history: BookingHistoryPort,
    private readonly notifier: BookingChangeNotifier,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(RescheduleBookingUseCase.name);
  }

  /**
   * UC-41-08: mueve la cita a otro slot, liberando el cupo del original.
   *
   * **Exige motivo** (corrección #14): mover un turno le cambia el día a
   * alguien. El motivo se valida en el servidor —no alcanza con que el
   * formulario lo pida— y queda en el historial de la cita, de donde lo lee la
   * otra parte.
   */
  async execute(
    bookingId: string,
    dto: RescheduleBookingDto,
    actor: AuthenticatedUser,
  ): Promise<RescheduleResponseDto> {
    const reason = requireReason(dto.reasonText, 'reprogramar la cita');

    this.logger.info(
      {
        operation: 'scheduling.booking.reschedule',
        bookingId,
        toSlotId: dto.toSlotId,
      },
      'Rescheduling booking',
    );

    const result = await this.em.transactional(async (tx) => {
      const booking = await this.bookingsRepo.findBookingByIdForUpdate(
        tx,
        bookingId,
      );
      if (!booking) {
        throw new ResourceNotFoundException(
          'Cita no encontrada',
          {
            bookingId,
          },
          SchedulingErrorReason.BOOKING_NOT_FOUND,
        );
      }

      // H3.S1.M2 (BOLA/IDOR de escritura): mismo hueco que `cancelAndNotify` —
      // reprogramar no comprobaba que el actor fuera el paciente titular.
      await this.access.assertMayActForPatient(
        booking.patientProfileId,
        actor,
        tx,
      );

      if (!ACTIVE_BOOKING_STATES.includes(booking.statusConceptId)) {
        throw new PreconditionFailedException(
          'Solo se reprograma una cita vigente',
          {
            bookingId,
          },
          SchedulingErrorReason.BOOKING_NOT_ACTIVE_FOR_RESCHEDULE,
        );
      }

      const fromSlotId = booking.bookableSlotId;
      if (fromSlotId === dto.toSlotId) {
        throw new PreconditionFailedException(
          'El slot destino es el mismo que el actual',
          {
            bookingId,
          },
          SchedulingErrorReason.RESCHEDULE_SAME_SLOT,
        );
      }

      const target = await this.bookingsRepo.findSlotForUpdate(
        tx,
        dto.toSlotId,
      );
      if (!target) {
        throw new ResourceNotFoundException(
          'Slot destino no encontrado',
          {
            slotId: dto.toSlotId,
          },
          SchedulingErrorReason.TARGET_SLOT_NOT_FOUND,
        );
      }
      if (target.remainingCapacity <= 0) {
        throw new ConflictException(
          'El slot destino no tiene cupos',
          {
            slotId: dto.toSlotId,
          },
          SchedulingErrorReason.TARGET_SLOT_NO_CAPACITY,
        );
      }

      // M4 · H1.S1: reprogramar es ocupar un rango nuevo, y era el único
      // camino que lo hacía sin preguntar. Que el cupo destino tenga lugar no
      // dice nada de OTRO cupo cuyo horario se pisa con éste: se corren las
      // mismas dos reglas que al confirmar (`materializeBooking`), sin que la
      // cita se compare consigo misma.
      const targetEnd = target.endAt ?? target.startAt;
      const patientClash =
        await this.bookingsRepo.findPatientBookingsOverlapping(
          tx,
          booking.patientProfileId,
          target.startAt,
          targetEnd,
          ACTIVE_BOOKING_STATES,
          booking.id,
        );
      if (patientClash.length > 0) {
        const clash = patientClash[0];
        throw new PreconditionFailedException(
          `El paciente ya tiene una cita confirmada a esa hora${
            clash.resourceName ? ` en «${clash.resourceName}»` : ''
          }.`,
          {
            bookingId: clash.id,
            startAt: clash.startAt,
          },
        );
      }
      const targetResource = await this.catalogRepo.findResourceById(
        tx,
        target.resourceId,
      );
      if (
        targetResource &&
        PRACTITIONER_PROFILE_TABLES.includes(targetResource.resourceRefType)
      ) {
        await this.professionalTime.assertRangeFree(
          tx,
          targetResource.resourceRefId,
          target.startAt,
          targetEnd,
          booking.id,
        );
      }

      const origin = await this.bookingsRepo.findSlotForUpdate(tx, fromSlotId);
      if (origin) {
        origin.remainingCapacity += 1;
        if (origin.statusConceptId !== CONCEPTS.SLOT_BLOCKED) {
          origin.statusConceptId = CONCEPTS.SLOT_OPEN;
        }
        touch(origin, actor.id);
      }

      target.remainingCapacity -= 1;
      if (target.remainingCapacity === 0)
        target.statusConceptId = CONCEPTS.SLOT_BOOKED;
      touch(target, actor.id);

      booking.bookableSlotId = dto.toSlotId;
      // La cita queda en el recurso de su cupo nuevo: si no, la regla madre
      // la seguía atribuyendo al recurso viejo (y a su profesional).
      booking.resourceId = target.resourceId;
      touch(booking, actor.id);

      this.bookingsRepo.recordReschedule(tx, {
        bookingId,
        fromSlotId,
        toSlotId: dto.toSlotId,
        rescheduledByUserId: actor.id,
        occurredAt: new Date(),
      });

      // El motivo va al historial y no a `booking_reschedules`: esa tabla solo
      // tiene `reason_concept_id` (de catálogo), y lo que la otra parte necesita
      // leer es el texto. Ver `state/booking-transition.ts`.
      await this.history.append(tx, bookingId, {
        operationConceptId: SCHED.HISTORY_OP_RESCHEDULE,
        dataSnapshot: {
          bookingId,
          fromSlotId,
          toSlotId: dto.toSlotId,
          reasonText: reason,
          actorKind: actorKindOf(actor),
        } satisfies BookingTransitionSnapshot,
        changedByUserId: actor.id,
      });

      return { bookingId, fromSlotId, toSlotId: dto.toSlotId };
    });

    // Con el motivo (P8): el aviso dice el horario nuevo y por qué se movió.
    await this.notifier.notifyChange(
      bookingId,
      'RESCHEDULED',
      reason,
      actorKindOf(actor),
    );
    return result;
  }
}
