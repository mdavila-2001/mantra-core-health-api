/**
 * Lo que el código hace con cada tabla, leído del inventario de endpoints (`tablas[]` de cada
 * operación). La confianza del inventario viaja con el dato: `DIRECTA`/`POR_SQL` es una escritura
 * vista en el código; `POR_TIPO`/`POR_REGISTRO` es una inferencia por tipo de endpoint y NO prueba nada.
 */

/** Una tabla tocada por una operación, tal como la publica el inventario. */
export interface InventoryTableRef {
  schema: string;
  tabla: string;
  /** `LEE`, `ESCRIBE` o `BORRA`. */
  operacion: string;
  detalle: string;
  confianza: string;
  fuente?: string;
}

/** Una observación de código sobre una tabla. */
export interface CodeObservation {
  detalle: 'CREA' | 'ACTUALIZA' | 'BORRA' | 'GUARDA';
  confianza: string;
  /** `archivo:línea` del código que lo hace. */
  fuente: string;
}

/** Confianzas que equivalen a haber visto la sentencia en el código. */
export const DIRECT_CONFIDENCE = new Set(['DIRECTA', 'POR_SQL']);

/**
 * Agrega las referencias del inventario por tabla, sin repetir fuente y sin las lecturas.
 * @returns Mapa `schema.tabla` → observaciones de escritura/borrado.
 */
export function collectCodeObservations(
  refs: Iterable<InventoryTableRef>,
): Map<string, CodeObservation[]> {
  const out = new Map<string, CodeObservation[]>();
  const seen = new Set<string>();
  for (const ref of refs) {
    if (ref.operacion === 'LEE') continue;
    if (!['CREA', 'ACTUALIZA', 'BORRA', 'GUARDA'].includes(ref.detalle))
      continue;
    const key = `${ref.schema}.${ref.tabla}`;
    const dedupe = `${key}|${ref.detalle}|${ref.confianza}|${ref.fuente ?? ''}`;
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    const list = out.get(key) ?? [];
    list.push({
      detalle: ref.detalle as CodeObservation['detalle'],
      confianza: ref.confianza,
      fuente: ref.fuente ?? 'inventario/endpoints (sin línea)',
    });
    out.set(key, list);
  }
  return out;
}
