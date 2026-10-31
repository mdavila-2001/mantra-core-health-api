/**
 * Reglas puras de una ubicación de inventario ligada a un espacio físico o a
 * una unidad clínica (CONTRATO-F2-F5 §F5c, botiquín por unidad).
 */

/** Lo que la regla necesita del espacio. */
export interface StockPointSpaceFacts {
  readonly tenantId: string;
  readonly practiceSiteId: string;
  /** Perfil de función `stockPoint`. */
  readonly stockPoint: boolean;
  /** Ciclo de vida ACTIVE y vigente. */
  readonly active: boolean;
}

/** Lo que la regla necesita de la unidad. */
export interface StockPointUnitFacts {
  readonly tenantId: string;
  readonly practiceSiteId: string;
}

/** Tipos de ubicación que se pueden dar de alta por la API. */
export type LocationTypeCode = 'SHELF' | 'WARD_STOCK';

/** Resultado de la regla. */
export type StockPointVerdict =
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly status: 404 | 422;
      readonly reason:
        | 'NOT_AVAILABLE'
        | 'STOCK_POINT_SITE_MISMATCH'
        | 'SPACE_NOT_STOCK_POINT'
        | 'WARD_STOCK_REQUIRES_UNIT';
    };

/**
 * Valida espacio y unidad de una ubicación.
 *
 * - Espacio o unidad inexistentes o de otro tenant → 404 (no se distinguen).
 * - Espacio o unidad de otra sede que la sede de farmacia → 422
 *   `STOCK_POINT_SITE_MISMATCH`.
 * - Espacio sin perfil `stockPoint` o no activo → 422 `SPACE_NOT_STOCK_POINT`.
 * - Botiquín (`WARD_STOCK`) sin unidad → 422 `WARD_STOCK_REQUIRES_UNIT`.
 *
 * @param input - Hechos ya leídos (`null` = no existe).
 */
export function judgeStockPoint(input: {
  readonly tenantId: string;
  readonly pharmacyPracticeSiteId: string;
  readonly locationType: LocationTypeCode;
  readonly careSpaceId?: string | null;
  readonly space?: StockPointSpaceFacts | null;
  readonly clinicalUnitId?: string | null;
  readonly unit?: StockPointUnitFacts | null;
}): StockPointVerdict {
  if (input.careSpaceId) {
    const s = input.space;
    if (!s || s.tenantId !== input.tenantId)
      return { ok: false, status: 404, reason: 'NOT_AVAILABLE' };
    if (s.practiceSiteId !== input.pharmacyPracticeSiteId)
      return { ok: false, status: 422, reason: 'STOCK_POINT_SITE_MISMATCH' };
    if (!s.stockPoint || !s.active)
      return { ok: false, status: 422, reason: 'SPACE_NOT_STOCK_POINT' };
  }
  if (input.clinicalUnitId) {
    const u = input.unit;
    if (!u || u.tenantId !== input.tenantId)
      return { ok: false, status: 404, reason: 'NOT_AVAILABLE' };
    if (u.practiceSiteId !== input.pharmacyPracticeSiteId)
      return { ok: false, status: 422, reason: 'STOCK_POINT_SITE_MISMATCH' };
  }
  if (input.locationType === 'WARD_STOCK' && !input.clinicalUnitId)
    return { ok: false, status: 422, reason: 'WARD_STOCK_REQUIRES_UNIT' };
  return { ok: true };
}
