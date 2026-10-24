import type { UnitOfWork } from './unit-of-work';

/** Una revisión del historial de una cita, tal como la lee la agenda. */
export interface BookingHistoryRevision {
  readonly dataSnapshot: unknown;
  readonly recordedAt: Date;
}

/** Lo que se sella en el historial de una cita. */
export interface BookingHistoryEntry {
  operationConceptId: string;
  dataSnapshot: unknown;
  changedByUserId?: string;
}

/**
 * Historial versionado de las citas (contexto `audit`).
 *
 * C-10: la agenda versiona cada transición vía el historial del módulo de
 * auditoría —contrato de dominio—, no escribiendo su tabla directamente.
 */
export interface BookingHistoryPort {
  /** Agrega una revisión al historial de la cita. */
  append(
    uow: UnitOfWork,
    bookingId: string,
    entry: BookingHistoryEntry,
  ): Promise<void>;

  /**
   * La última revisión de cada cita que cumple el predicado, en una consulta.
   *
   * @returns Mapa `bookingId → revisión`; sin entrada para las que no tienen.
   */
  latestByBooking(
    uow: UnitOfWork,
    bookingIds: readonly string[],
    matches?: (revision: BookingHistoryRevision) => boolean,
  ): Promise<Map<string, BookingHistoryRevision>>;
}

/** Token de inyección del historial de citas. */
export const BOOKING_HISTORY_PORT = Symbol('BOOKING_HISTORY_PORT');
