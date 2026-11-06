/**
 * Regla pura de la dispensa desde un botiquín (CONTRATO-F2-F5 §F5c): sólo se
 * entrega lo disponible, más lo que la **misma** reserva retiene para la misma
 * ubicación, producto y lote. La sola presencia de una reserva no saltea el
 * control (revisión de seguridad de F5c).
 */

/** Clave de una posición de stock. */
export interface StockKey {
  readonly inventoryLocationId: string;
  readonly pharmacyProductId: string;
  readonly inventoryLotId?: string | null;
}

/** Lo que una línea de reserva retiene todavía. */
export interface HeldLine extends StockKey {
  readonly held: number;
}

const keyOf = (k: StockKey): string =>
  `${k.inventoryLocationId}|${k.pharmacyProductId}|${k.inventoryLotId ?? ''}`;

/** Saldo retenido por clave (se va consumiendo línea a línea). */
export class HeldByKey {
  private readonly held = new Map<string, number>();

  constructor(lines: readonly HeldLine[]) {
    for (const l of lines) {
      if (!(l.held > 0)) continue;
      const k = keyOf(l);
      this.held.set(k, (this.held.get(k) ?? 0) + l.held);
    }
  }

  /** Cuánto retiene la reserva para esa clave exacta. */
  of(key: StockKey): number {
    return this.held.get(keyOf(key)) ?? 0;
  }

  /** Descuenta lo usado por una línea. */
  consume(key: StockKey, quantity: number): void {
    const k = keyOf(key);
    this.held.set(k, Math.max(0, (this.held.get(k) ?? 0) - quantity));
  }
}

/**
 * ¿Alcanza para dispensar desde el botiquín?
 *
 * @param available - `available_quantity` de la posición (0 si no existe).
 * @param heldByThisReservation - Lo que la reserva de la dispensa retiene para
 *   esa misma clave (0 sin reserva o si la reserva es de otro lote/producto).
 * @param requested - Cantidad a dispensar.
 */
export function wardStockCovers(
  available: number,
  heldByThisReservation: number,
  requested: number,
): boolean {
  return available + Math.max(0, heldByThisReservation) >= requested;
}
