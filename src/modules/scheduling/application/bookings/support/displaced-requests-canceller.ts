import type { AppointmentBookings } from '../../../entities';
import { CONCEPTS, touch, type AuthenticatedUser } from '../../../../../common';
import { BookingTransitionRecorder } from './booking-transition-recorder';
import { DISPLACED_REASON } from '../../../domain/booking/booking-defaults';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { PENDING_BOOKING_STATES } from '../../../domain/booking/booking-states';
import { SchedulingBookingsRepository } from '../../../infrastructure/repositories';
import { ServiceSlotLifecycle } from './service-slot-lifecycle';

/**
 * REGLA 2: aceptar una solicitud desplaza las del mismo paciente que chocan
 * con ella.
 */

@Injectable()
export class DisplacedRequestsCanceller {
  constructor(
    private readonly bookingsRepo: SchedulingBookingsRepository,
    private readonly transitions: BookingTransitionRecorder,
    private readonly serviceSlots: ServiceSlotLifecycle,
  ) {}

  /**
   * Cancela las solicitudes del paciente que chocan con la que se acaba de
   * aceptar.
   *
   * ## Por qué existe
   *
   * Pedirle turno a varios médicos para la misma hora es cómo se consigue
   * turno: nadie sabe cuál va a decir que sí. Pero en cuanto uno acepta, las
   * demás dejaron de ser posibles —el paciente no puede estar en dos lados— y
   * si nadie las cierra quedan pendientes ocupando cupo, esperando una
   * respuesta que ya no importa, y bloqueando esos huecos para otra persona.
   *
   * ## Por qué sólo las PENDIENTES
   *
   * Una confirmada no se toca jamás desde acá: si el paciente ya tenía un
   * turno aceptado a esa hora, esta aceptación no debería haber ocurrido —la
   * regla 1 lo impide al pedir—, y cancelar automáticamente algo que otro
   * médico ya comprometió sería decidir por él. Ese caso se resuelve hablando,
   * no con una regla.
   *
   * ## Por qué el cupo se libera
   *
   * Porque la solicitud lo estaba reteniendo. Dejarlo tomado castigaría al
   * siguiente paciente por una cita que ya no va a existir.
   *
   * @param tx - Transacción en curso; va dentro de la misma que confirma.
   * @param accepted - La cita que se acaba de confirmar.
   * @param actor - Quien aceptó.
   * @returns Los identificadores de las que se cancelaron.
   */
  async cancelConflictingPending(
    tx: EntityManager,
    accepted: AppointmentBookings,
    actor: AuthenticatedUser,
  ): Promise<string[]> {
    const slot = await this.bookingsRepo.findSlotById(
      tx,
      accepted.bookableSlotId,
    );
    if (!slot) return [];

    const clashing = await this.bookingsRepo.findPatientBookingsOverlapping(
      tx,
      accepted.patientProfileId,
      slot.startAt,
      slot.endAt ?? slot.startAt,
      PENDING_BOOKING_STATES,
      accepted.id,
    );

    const cancelled: string[] = [];
    for (const other of clashing) {
      const booking = await this.bookingsRepo.findBookingByIdForUpdate(
        tx,
        other.id,
      );
      if (!booking) continue;

      const previous = booking.statusConceptId;
      this.bookingsRepo.createCancellation(tx, {
        bookingId: booking.id,
        reasonConceptId: CONCEPTS.CANCEL_BY_PROVIDER,
        cancelledByUserId: actor.id,
        isNoShow: false,
        cancelledAt: new Date(),
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });

      booking.statusConceptId = CONCEPTS.BOOKING_CANCELLED;
      touch(booking, actor.id);
      await this.transitions.recordTransition(tx, booking, actor, {
        bookingId: booking.id,
        fromStateConceptId: previous,
        toStateConceptId: CONCEPTS.BOOKING_CANCELLED,
        reasonText: DISPLACED_REASON,
        actorKind: 'PROVIDER',
      });

      // El cupo vuelve a estar libre: lo retenía una solicitud que ya no va.
      const ownSlot = await this.bookingsRepo.findSlotForUpdate(
        tx,
        booking.bookableSlotId,
      );
      if (ownSlot) {
        ownSlot.remainingCapacity += 1;
        if (ownSlot.practitionerServiceOfferingId) {
          await this.serviceSlots.discardOneOffSlot(tx, ownSlot, actor.id);
        } else {
          if (ownSlot.statusConceptId === CONCEPTS.SLOT_HELD) {
            ownSlot.statusConceptId = CONCEPTS.SLOT_OPEN;
          }
          touch(ownSlot, actor.id);
        }
      }

      cancelled.push(booking.id);
    }

    return cancelled;
  }
}
