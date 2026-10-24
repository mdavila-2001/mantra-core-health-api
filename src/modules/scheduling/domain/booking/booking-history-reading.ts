import type { BookingTransitionSnapshot } from './booking-transition';

/** Lo mínimo de una revisión del historial que este módulo sabe leer. */
export interface HistoryRevisionLike {
  readonly dataSnapshot: unknown;
}

/**
 * El snapshot de una revisión, si tiene la forma que este módulo escribe.
 *
 * La columna es `jsonb` y llega como `unknown`: puede traer lo que haya escrito
 * cualquier versión anterior. Se comprueba en vez de castear, porque una cita de
 * antes de la corrección #14 tiene snapshot sin motivo y eso es normal, no un
 * error.
 */
export function readSnapshot(
  revision: HistoryRevisionLike,
): BookingTransitionSnapshot | null {
  const snapshot: unknown = revision.dataSnapshot;
  if (typeof snapshot !== 'object' || snapshot === null) {
    return null;
  }
  return snapshot as BookingTransitionSnapshot;
}

/** Si la revisión explica el cambio: es la que se le muestra a la otra parte. */
export function hasReason(revision: HistoryRevisionLike): boolean {
  const reason = readSnapshot(revision)?.reasonText;
  return typeof reason === 'string' && reason.trim().length > 0;
}

/**
 * Si la revisión es una demora informada (P8).
 *
 * Se reconoce por sus minutos y no por el concepto de operación porque el
 * predicado sólo ve el snapshot; los minutos son, además, lo único sin lo cual
 * la demora no se puede mostrar.
 */
export function isDelay(revision: HistoryRevisionLike): boolean {
  const minutes = readSnapshot(revision)?.delayMinutes;
  return typeof minutes === 'number' && minutes > 0;
}
