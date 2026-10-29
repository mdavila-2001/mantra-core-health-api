import { AppointmentPaymentStates } from '../../../entities';
import type { AppointmentBookings } from '../../../entities';
import {
  createdBy,
  touch,
  type AuthenticatedUser,
} from '../../../../../common';
import type { BookingHistoryPort } from '../../ports/booking-history.port';
import type { EntityManager } from '@mikro-orm/postgresql';
import { SCHED } from '../../../domain/scheduling.concepts';
import type { SchedulingBookingsRepository } from '../../../infrastructure/repositories';
import { randomUUID } from 'node:crypto';

/** Lo que se marca: el concepto del estado y si se usó seguro. */
export interface PaymentStateMark {
  readonly statusConceptId: string;
  /**
   * Si se usó seguro. Sin valor, la fila conserva la marca que ya tenía
   * (`false` si no había fila): confirmar un comprobante dice que se pagó, no
   * cómo.
   */
  readonly insuranceUsed?: boolean;
}

/**
 * Escribe el estado de pago de una cita y deja su huella en el historial.
 *
 * Es la escritura de `SetPaymentStateUseCase`, sacada acá para que confirmar un
 * comprobante deje la cita pagada **exactamente igual** que marcarla a mano:
 * una fila por cita cargada con `FOR UPDATE`, firmada con quién y cuándo, y una
 * revisión `HISTORY_OP_PAYMENT_MARKED` en el historial append-only. Dos copias
 * de esta regla serían dos reglas.
 *
 * Corre dentro de la transacción de quien llama, que ya comprobó que la cita
 * admite estado de pago.
 *
 * @param tx - Transacción activa.
 * @param bookingsRepo - Acceso a la fila de pago.
 * @param history - Historial de la cita.
 * @param booking - La cita, ya cargada y autorizada.
 * @param mark - En qué estado queda y si se usó seguro.
 * @param actor - Quien marca; queda firmado en la fila.
 * @returns La fila tal como quedó.
 */
export async function writePaymentState(
  tx: EntityManager,
  bookingsRepo: SchedulingBookingsRepository,
  history: BookingHistoryPort,
  booking: AppointmentBookings,
  mark: PaymentStateMark,
  actor: AuthenticatedUser,
): Promise<AppointmentPaymentStates> {
  const now = new Date();

  const existing = await bookingsRepo.findPaymentStateForUpdate(tx, booking.id);
  const previousConcept = existing?.statusConceptId ?? null;

  let row: AppointmentPaymentStates;
  if (existing) {
    existing.statusConceptId = mark.statusConceptId;
    existing.insuranceUsed = mark.insuranceUsed ?? existing.insuranceUsed;
    existing.markedByUserId = actor.id;
    existing.markedAt = now;
    touch(existing, actor.id);
    row = existing;
  } else {
    row = tx.create(AppointmentPaymentStates, {
      id: randomUUID(),
      tenantId: booking.tenantId,
      appointmentBookingId: booking.id,
      statusConceptId: mark.statusConceptId,
      insuranceUsed: mark.insuranceUsed ?? false,
      markedByUserId: actor.id,
      markedAt: now,
      // `createdBy` ya pone createdAt y updatedAt con el mismo instante.
      ...createdBy(actor.id, now),
      rowVersion: 1,
    });
    tx.persist(row);
  }

  // La huella. Sin esto, volver a «pendiente» borraría que alguna vez
  // estuvo pagada, y marcar un pago es una afirmación sobre el dinero de
  // alguien.
  await history.append(tx, booking.id, {
    operationConceptId: SCHED.HISTORY_OP_PAYMENT_MARKED,
    dataSnapshot: {
      bookingId: booking.id,
      fromPaymentConceptId: previousConcept,
      toPaymentConceptId: mark.statusConceptId,
      insuranceUsed: row.insuranceUsed,
    },
    changedByUserId: actor.id,
  });

  return row;
}
