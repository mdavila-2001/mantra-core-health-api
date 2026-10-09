import { PreconditionFailedException } from '../../../../../common';
import { SchedulingErrorReason } from '../../../scheduling.error-reasons';
import {
  MIN_REASON_LENGTH,
  judgeReason,
} from '../../../domain/booking/booking-transition';

/**
 * Exige un motivo de verdad y lo devuelve normalizado (corrección #14).
 *
 * Traduce el veredicto del dominio (`judgeReason`) a la excepción HTTP: 422 con
 * el mismo mensaje y `failureCode` de siempre.
 *
 * @param raw - Lo que llegó en el cuerpo.
 * @param action - Qué se estaba haciendo, para que el error lo diga.
 * @returns El motivo listo para persistir.
 * @throws PreconditionFailedException si está vacío, es demasiado corto o es
 * relleno.
 */
export function requireReason(raw: string | undefined, action: string): string {
  const verdict = judgeReason(raw);
  if (verdict.ok) return verdict.reason;

  if (verdict.violation === 'REASON_REQUIRED') {
    throw new PreconditionFailedException(
      `Indique el motivo para ${action}: es obligatorio y debe explicar el cambio.`,
      { failureCode: 'REASON_REQUIRED', minLength: MIN_REASON_LENGTH },
      SchedulingErrorReason.REASON_REQUIRED,
    );
  }

  throw new PreconditionFailedException(
    `El motivo para ${action} no puede ser un texto de relleno: escriba la razón real.`,
    { failureCode: 'REASON_PLACEHOLDER' },
    SchedulingErrorReason.REASON_PLACEHOLDER,
  );
}
