import { createHash } from 'node:crypto';

/** Largo de una ventana de stock: dentro de ella, dos consultas dan lo mismo. */
export const STOCK_WINDOW_MS = 5 * 60 * 1000;

/** Ventanas que dura un ciclo de venta y reposición (30 minutos). */
const CYCLE_WINDOWS = 6;

/** Tope de unidades al reponer. */
const MAX_RESTOCK = 40;

export interface StockWindow {
  /** Número de ventana desde la época Unix. */
  index: number;
  start: Date;
  end: Date;
}

export function stockWindow(now: Date): StockWindow {
  const index = Math.floor(now.getTime() / STOCK_WINDOW_MS);
  return {
    index,
    start: new Date(index * STOCK_WINDOW_MS),
    end: new Date((index + 1) * STOCK_WINDOW_MS),
  };
}

/**
 * Stock de un producto en una sucursal durante una ventana.
 *
 * Determinista por farmacia, sucursal, producto y ventana, sin estado en
 * memoria: reiniciar el simulador no cambia lo que responde.
 *
 * - Cada producto se repone a un nivel propio (8…40) al empezar su ciclo de
 *   seis ventanas, con un desfase propio para que no se repongan todos juntos.
 * - En cada ventana del ciclo baja según su ritmo de venta (1…8 por ventana),
 *   sin pasar de 0: los que venden rápido se agotan antes de reponerse.
 * - Además, una de cada diez ventanas el producto da 0 aunque le quede: el
 *   faltante puntual que una farmacia real también tiene.
 *
 * La farmacia entra en la semilla, así que dos farmacias con sedes del mismo
 * código no comparten stock.
 */
export function windowedQuantity(
  pharmacyCode: string,
  siteCode: string,
  productCode: string,
  windowIndex: number,
): number {
  const product = digest(`${pharmacyCode}|${siteCode}|${productCode}`);
  const restockLevel = 8 + (product.readUInt16BE(0) % (MAX_RESTOCK - 7));
  const salesPerWindow = 1 + (product.readUInt8(2) % 8);
  const offset = product.readUInt8(3) % CYCLE_WINDOWS;
  const phase = (windowIndex + offset) % CYCLE_WINDOWS;

  const outThisWindow =
    digest(
      `${pharmacyCode}|${siteCode}|${productCode}|${windowIndex}`,
    ).readUInt8(0) %
      10 ===
    0;
  if (outThisWindow) return 0;
  return Math.max(0, restockLevel - phase * salesPerWindow);
}

/**
 * Precio unitario en bolivianos, estable por farmacia y producto (cada
 * farmacia fija los suyos): 5,00…150,00 con dos decimales.
 */
export function unitPriceCents(
  pharmacyCode: string,
  productCode: string,
): number {
  const seed = digest(`price|${pharmacyCode}|${productCode}`);
  return 500 + (seed.readUInt32BE(0) % 14_501);
}

function digest(seed: string): Buffer {
  return createHash('sha256').update(seed).digest();
}
