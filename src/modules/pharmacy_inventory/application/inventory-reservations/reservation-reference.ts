/** Referencia mínima que la liberación necesita de una reserva o pedido. */
export interface ReservationReference {
  readonly id: string;
  readonly pharmacyId: string;
  readonly pharmacySiteId: string;
}

/** Opciones para devolver solo un subconjunto de líneas confirmadas. */
export interface ReleaseConfirmedLinesOptions {
  readonly onlyLineIds?: readonly string[];
}
