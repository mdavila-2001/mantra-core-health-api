import { CLIN } from '../clinical.concepts';

/**
 * Estado de un ítem de receta (`clinical.medication_requests`) para usarlo
 * fuera de la clínica: compartirlo, abrirlo en una farmacia o pedirlo.
 *
 * - `ACTIVE`: emitido y sin vencer.
 * - `EXPIRED`: emitido, pero su `valid_to` ya pasó.
 * - `NOT_ACTIVE`: borrador, invalidado, reemplazado o completado.
 *
 * Es la única regla de «receta vigente» del sistema: el pedido, el enlace
 * compartido y la pantalla de la farmacia la toman de acá.
 */
export type PrescriptionItemState = 'ACTIVE' | 'EXPIRED' | 'NOT_ACTIVE';

/** Lo que la regla necesita de un `medication_request`. */
export interface PrescriptionItemValidityInput {
  statusConceptId: string;
  validTo?: Date | null;
}

/**
 * Estado de un ítem de receta a una fecha dada.
 *
 * Un reemplazo vigente es un ítem `ISSUED` más, así que entra como cualquier
 * otro; el original queda `REPLACED` y sale.
 *
 * @param row - Estado y vencimiento del ítem.
 * @param now - Instante contra el que se compara `validTo`.
 * @returns `ACTIVE`, `EXPIRED` o `NOT_ACTIVE`.
 */
export function prescriptionItemState(
  row: PrescriptionItemValidityInput,
  now: Date,
): PrescriptionItemState {
  if (row.statusConceptId !== CLIN.MEDICATION_REQUEST_ISSUED) {
    return 'NOT_ACTIVE';
  }
  if (row.validTo && row.validTo.getTime() <= now.getTime()) {
    return 'EXPIRED';
  }
  return 'ACTIVE';
}
