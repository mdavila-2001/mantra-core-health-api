import { CONCEPTS } from '../../../common';

/**
 * Vencimiento y estado del enlace compartido de una receta (S-5).
 *
 * El enlace vence con la receta (el `valid_to` más próximo de sus ítems) o a
 * los 30 días si ninguno lo tiene, lo que ocurra primero. No hay barrido que
 * pase las filas a `EXPIRED`: el estado se calcula al leer.
 */

/** Vida máxima de un enlace, en días. */
export const SHARE_MAX_LIFETIME_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Estado del enlace tal como lo ven la vista pública y la farmacia. */
export type PrescriptionShareStatus = 'VALID' | 'EXPIRED' | 'REVOKED';

/** Lo que el estado necesita de la fila del enlace. */
export interface ShareStatusInput {
  readonly statusConceptId: string;
  readonly expiresAt: Date;
  readonly revokedAt?: Date | null;
}

/**
 * Cuándo vence un enlace nuevo.
 *
 * @param items - Ítems vigentes que comparte (solo se lee `validTo`).
 * @param now - Instante de creación.
 * @returns El menor `validTo` de los ítems o `now + 30 días`, el anterior.
 */
export function shareExpiresAt(
  items: ReadonlyArray<{ readonly validTo?: Date | null }>,
  now: Date,
): Date {
  let expiresAt = now.getTime() + SHARE_MAX_LIFETIME_DAYS * DAY_MS;
  for (const item of items) {
    if (item.validTo && item.validTo.getTime() < expiresAt) {
      expiresAt = item.validTo.getTime();
    }
  }
  return new Date(expiresAt);
}

/**
 * Estado de un enlace según su fila.
 *
 * Revocado gana sobre vencido: si el paciente lo revocó, eso es lo que se
 * informa aunque además haya vencido. Una fila `ACTIVE` con `expiresAt`
 * pasado se lee `EXPIRED`.
 *
 * @param row - Estado, vencimiento y revocación de la fila.
 * @param now - Instante de la lectura.
 * @returns `VALID`, `EXPIRED` o `REVOKED`.
 */
export function shareStatusOf(
  row: ShareStatusInput,
  now: Date,
): PrescriptionShareStatus {
  if (row.revokedAt || row.statusConceptId === CONCEPTS.STATE_REVOKED) {
    return 'REVOKED';
  }
  if (
    row.statusConceptId === CONCEPTS.STATE_EXPIRED ||
    row.expiresAt.getTime() <= now.getTime()
  ) {
    return 'EXPIRED';
  }
  return 'VALID';
}

/**
 * Estado efectivo: el de la fila, y además `EXPIRED` si a la fecha de lectura
 * la receta ya no tiene ningún ítem vigente (se invalidó, se completó o se
 * reemplazó después de compartirla). Un enlace no sigue «válido» para una
 * receta que dejó de valer.
 *
 * @param row - Estado, vencimiento y revocación de la fila.
 * @param activeItemCount - Ítems vigentes de la receta al leer.
 * @param now - Instante de la lectura.
 * @returns `VALID`, `EXPIRED` o `REVOKED`.
 */
export function effectiveShareStatus(
  row: ShareStatusInput,
  activeItemCount: number,
  now: Date,
): PrescriptionShareStatus {
  const status = shareStatusOf(row, now);
  if (status === 'VALID' && activeItemCount === 0) return 'EXPIRED';
  return status;
}
