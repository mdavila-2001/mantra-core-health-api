import { AppointmentPaymentStates } from '../../../entities';
import {
  BookingDelayNoticeDto,
  BookingStatusReasonDto,
  PaymentStateDto,
} from '../../../presentation/dto';
import type { BookingHistoryRevision } from '../../ports/booking-history.port';
import {
  PAYMENT_CONCEPT_STATE,
  PAYMENT_STATE_LABEL,
} from '../../../domain/booking/payment-state';
import { readSnapshot } from '../../../domain/booking/booking-history-reading';

/** Proyecciones puras de lo guardado a lo que ve el cliente. */
/**
 * De la fila guardada a lo que ve el cliente.
 *
 * Traduce el concepto a su clave estable y le pone la etiqueta: el cliente no
 * tiene por qué conocer los uuid de terminología, y si los conociera acabaría
 * comparándolos a mano en el front.
 */
export function projectPaymentState(
  row: AppointmentPaymentStates,
): PaymentStateDto {
  const state = PAYMENT_CONCEPT_STATE[row.statusConceptId];
  return {
    state,
    label: PAYMENT_STATE_LABEL[state],
    conceptId: row.statusConceptId,
    insuranceUsed: row.insuranceUsed,
    markedByUserId: row.markedByUserId,
    markedAt: row.markedAt.toISOString(),
  };
}

/**
 * La demora tal como sale por la API.
 *
 * `undefined` cuando no hay ninguna: quien la consuma tiene que poder preguntar
 * «¿se demora?» sin inspeccionar campos vacíos, igual que con el motivo.
 */
export function toDelayNotice(
  revision: BookingHistoryRevision | undefined,
): BookingDelayNoticeDto | undefined {
  if (!revision) return undefined;
  const snapshot = readSnapshot(revision);
  const minutes = snapshot?.delayMinutes;
  if (typeof minutes !== 'number' || minutes <= 0) return undefined;

  const message = snapshot?.reasonText;
  return {
    delayMinutes: minutes,
    ...(typeof message === 'string' && message.trim().length > 0
      ? { message: message }
      : {}),
    announcedAt: revision.recordedAt,
  };
}

/**
 * El motivo tal como sale por la API.
 *
 * `undefined` —y no un objeto con campos vacíos— cuando no hay ninguno: quien
 * lo consuma tiene que poder preguntar «¿hay motivo?» sin inspeccionar el
 * contenido.
 */
export function toStatusReason(
  revision: BookingHistoryRevision | undefined,
): BookingStatusReasonDto | undefined {
  if (!revision) return undefined;
  const snapshot = readSnapshot(revision);
  const reason = snapshot?.reasonText;
  if (typeof reason !== 'string' || reason.trim().length === 0) {
    return undefined;
  }

  return {
    reasonText: reason,
    ...(snapshot?.actorKind === undefined
      ? {}
      : { actorKind: snapshot.actorKind }),
    ...(snapshot?.toStateConceptId === undefined
      ? {}
      : { toStateConceptId: snapshot.toStateConceptId }),
    changedAt: revision.recordedAt,
  };
}
