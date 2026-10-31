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
import type {
  AppointmentBookings,
  BookableSlots,
  SchedulableResources,
} from '../../../entities';
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
import { ServiceSlotLifecycle } from '../support/service-slot-lifecycle';
import {
  actorKindOf,
  isSupportActor,
} from '../../../domain/booking/agenda-actors';
import { slotHoldRefusal } from '../../../domain/booking/hold-admission';
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
    private readonly serviceSlots: ServiceSlotLifecycle,
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
        throw new ResourceNotFoundException('Cita no encontrada', {
          bookingId,
        });
      }

      // H3.S1.M2 (BOLA/IDOR de escritura): mismo hueco que `cancelAndNotify` —
      // reprogramar no comprobaba que el actor fuera el paciente titular.
      // SEG V-1: quien atiende solo reprograma lo de su propia agenda.
      await this.access.assertMayChangeBooking(tx, booking, actor);
      await this.access.assertSupportMayAct(
        tx,
        booking,
        actor,
        'schedule.reschedule',
        // El motivo ya validado cumple la obligación «motivo» del permiso.
        { reasonText: reason },
      );

      if (!ACTIVE_BOOKING_STATES.includes(booking.statusConceptId)) {
        throw new PreconditionFailedException(
          'Solo se reprograma una cita vigente',
          {
            bookingId,
          },
        );
      }

      const fromSlotId = booking.bookableSlotId;
      await this.serviceSlots.assertNotAService(tx, fromSlotId, 'reprogramar');
      if (fromSlotId === dto.toSlotId) {
        throw new PreconditionFailedException(
          'El slot destino es el mismo que el actual',
          {
            bookingId,
          },
        );
      }

      const target = await this.bookingsRepo.findSlotForUpdate(
        tx,
        dto.toSlotId,
      );
      if (!target) {
        throw new ResourceNotFoundException('Slot destino no encontrado', {
          slotId: dto.toSlotId,
        });
      }
      // La persona de apoyo mueve la cita solo si su permiso cubre TAMBIÉN el
      // cupo destino (su doctor, servicio y espacio), y solo a un horario libre,
      // futuro, del mismo servicio y de la misma organización de la cita.
      const targetResource = await this.catalogRepo.findResourceById(
        tx,
        target.resourceId,
      );
      if (isSupportActor(actor, booking.tenantId)) {
        await this.assertSupportTarget(
          tx,
          booking,
          target,
          targetResource,
          actor,
        );
      }

      if (target.remainingCapacity <= 0) {
        throw new ConflictException('El slot destino no tiene cupos', {
          slotId: dto.toSlotId,
        });
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
        // SEG A-M4: sin agenda, hora ni id de la otra cita (puede ser fuera del
        // alcance de quien reprograma).
        throw new PreconditionFailedException(
          'El paciente no está disponible en ese horario.',
        );
      }
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

  /**
   * Lo que se le exige al cupo destino cuando mueve la cita una persona de apoyo.
   *
   * - Es de la misma organización que la cita: si no, se responde como si no
   *   existiera (404), sin decir que es de otra.
   * - Su permiso `schedule.reschedule` lo cubre (doctor, servicio y espacio del
   *   DESTINO, además de los de la cita que ya cubrió el origen): 403 si no.
   * - Está libre (con cupo, sin bloqueo ni retiro), es futuro y es del mismo
   *   servicio que la cita: 422 si no.
   */
  private async assertSupportTarget(
    tx: EntityManager,
    booking: AppointmentBookings,
    target: BookableSlots,
    targetResource: SchedulableResources | null,
    actor: AuthenticatedUser,
  ): Promise<void> {
    if (!targetResource || targetResource.tenantId !== booking.tenantId) {
      throw new ResourceNotFoundException('Slot destino no encontrado', {
        slotId: target.id,
      });
    }
    await this.access.assertSupportMayOnSlot(
      tx,
      target,
      actor,
      'schedule.reschedule',
    );
    if (slotHoldRefusal(target) !== null) {
      throw new PreconditionFailedException(
        'El horario destino no está libre.',
        { slotId: target.id },
        SchedulingErrorReason.RESCHEDULE_TARGET_NOT_FREE,
      );
    }
    if (target.startAt.getTime() <= Date.now()) {
      throw new PreconditionFailedException(
        'El horario destino ya pasó: elija uno futuro.',
        { slotId: target.id },
        SchedulingErrorReason.RESCHEDULE_TARGET_NOT_FUTURE,
      );
    }
    if (
      (target.healthcareServiceId ?? null) !==
      (booking.healthcareServiceId ?? null)
    ) {
      throw new PreconditionFailedException(
        'El horario destino es de otro servicio: la cita se mueve dentro del mismo servicio.',
        { slotId: target.id },
        SchedulingErrorReason.RESCHEDULE_TARGET_OTHER_SERVICE,
      );
    }
  }
}
