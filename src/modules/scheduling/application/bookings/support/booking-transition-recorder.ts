import type { AppointmentBookings } from '../../../entities';
import {
  PreconditionFailedException,
  type AuthenticatedUser,
} from '../../../../../common';
import {
  BOOKING_HISTORY_PORT,
  type BookingHistoryPort,
} from '../../ports/booking-history.port';
import type { BookingTransitionSnapshot } from '../../../domain/booking/booking-transition';
import { EntityManager } from '@mikro-orm/postgresql';
import { Inject, Injectable } from '@nestjs/common';
import { PENDING_DECISION_STATES } from '../../../domain/booking/booking-states';
import { SCHED } from '../../../domain/scheduling.concepts';
import { isValidBookingTransition } from '../../../domain/booking/booking-state-machine';

/**
 * La máquina de estados de la cita aplicada a la unidad de trabajo: valida que
 * una transición exista (C-10) y la deja asentada en el historial.
 */

@Injectable()
export class BookingTransitionRecorder {
  constructor(
    @Inject(BOOKING_HISTORY_PORT)
    private readonly history: BookingHistoryPort,
  ) {}

  /**
   * Guarda de la máquina de estados de cita (C-10): rechaza cualquier transición
   * que la máquina no declara con `PreconditionFailedException`
   * (INVALID_STATE_TRANSITION). Es lo que impide, por ejemplo, hacer check-in de
   * una cita cancelada o completar una que nunca empezó.
   */
  assertTransition(from: string, to: string): void {
    if (!isValidBookingTransition(from, to)) {
      throw new PreconditionFailedException(
        'Transición de estado de cita no permitida',
        {
          failureCode: 'INVALID_STATE_TRANSITION',
          fromStateConceptId: from,
          toStateConceptId: to,
        },
      );
    }
  }

  /**
   * Registra la transición en el historial existente
   * (`audit.appointment_bookings_history`). Se llama tras validar la transición y
   * aplicar el nuevo estado, con el estado de origen capturado antes de mutar.
   *
   * El snapshot va tipado (`BookingTransitionSnapshot`) porque desde la
   * corrección #14 no lleva solo los dos estados: lleva también el motivo y
   * desde qué lado se hizo el cambio, y la lectura los busca por nombre.
   */
  async recordTransition(
    tx: EntityManager,
    booking: AppointmentBookings,
    actor: AuthenticatedUser,
    snapshot: BookingTransitionSnapshot,
  ): Promise<void> {
    // C-10: versiona la transición vía el historial del módulo audit (contrato de
    // dominio), no escribiendo su tabla directamente (evita DIRECT_CROSS_DOMAIN).
    await this.history.append(tx, booking.id, {
      operationConceptId: SCHED.HISTORY_OP_STATE_TRANSITION,
      dataSnapshot: snapshot,
      changedByUserId: actor.id,
    });
  }

  /**
   * Exige que la solicitud siga esperando una respuesta del prestador.
   *
   * Pedir documentación o proponer otro horario sobre una cita ya aceptada, ya
   * rechazada o ya atendida no es una operación tardía: es otra cosa, y tiene
   * sus propios caminos (`reschedule`, `cancel`).
   *
   * @param fromState - Estado en el que está la reserva.
   * @param bookingId - Reserva evaluada, para el detalle del error.
   */
  assertPending(fromState: string, bookingId: string): void {
    if (!PENDING_DECISION_STATES.includes(fromState)) {
      throw new PreconditionFailedException(
        'Sólo se opera así sobre una solicitud pendiente',
        { bookingId, statusConceptId: fromState },
      );
    }
  }
}
