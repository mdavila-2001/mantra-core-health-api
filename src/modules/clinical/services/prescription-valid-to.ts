import { PreconditionFailedException } from '../../../common';
import { ClinicalErrorReason } from '../clinical.error-reasons';

/** Lo que lee la persona cuando la receta ya nacería vencida. */
export const VALID_TO_IN_PAST_MESSAGE =
  'La fecha de fin de vigencia de la receta ya pasó: indique una fecha futura.';

/**
 * Una receta no se emite, edita, reemplaza ni renueva con su `validTo` en el
 * pasado: nacería vencida. Usa el mismo corte que la regla única de receta
 * vigente (`prescriptionItemState`): vencer en este mismo instante ya es
 * estar vencida. Sin `validTo`, la receta no vence y pasa.
 *
 * @param validTo - El fin de vigencia que quedaría en la receta.
 * @param now - El instante de la operación.
 * @param details - Contexto del error (la receta, la operación).
 * @throws PreconditionFailedException `MEDICATION_VALID_TO_IN_PAST` (422).
 */
export function assertValidToNotInPast(
  validTo: Date | null | undefined,
  now: Date,
  details: Record<string, unknown> = {},
): void {
  if (!validTo || validTo.getTime() > now.getTime()) return;
  throw new PreconditionFailedException(
    VALID_TO_IN_PAST_MESSAGE,
    { ...details, validTo: validTo.toISOString() },
    ClinicalErrorReason.MEDICATION_VALID_TO_IN_PAST,
  );
}
