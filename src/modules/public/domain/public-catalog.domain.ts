export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Un importe que es cero, con o sin decimales (`0`, `0.00`). */
export const ZERO_AMOUNT_REGEX = /^0+(\.0+)?$/;

export interface OfferedServicePureRow {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly descriptionText: string | null;
  readonly price: string;
  readonly currency: string | null;
  readonly isActive: boolean;
}

export interface PharmacyProductPureRow {
  readonly id: string;
  readonly sortName: string;
  readonly brandName: string | null;
  readonly strengthText: string | null;
  readonly packageSizeText: string | null;
  readonly price: string | null;
  readonly currency: string | null;
  readonly availableQuantity: string | number;
  readonly requiresPrescription: boolean | null;
  /**
   * Sedes activas donde el producto está **disponible** según la regla única
   * de existencias (`siteProductAvailabilitySql`: lotes si la sede los lleva,
   * lo declarado en el catálogo si no, y nunca lo marcado «no tengo»).
   * Ausente = no se consultó.
   */
  readonly availableSites?: string | number;
}

/**
 * Si se rotula «hay»: si el producto está disponible en alguna sede activa.
 * La decisión por sede no se repite acá: la toma `siteProductAvailabilitySql`
 * en la base (defecto A1, 26/10/2026). Sin ese dato, como antes de P47: lo
 * disponible del libro.
 */
export function publicInStock(row: PharmacyProductPureRow): boolean {
  if (row.availableSites !== undefined) return Number(row.availableSites) > 0;
  return Number(row.availableQuantity) > 0;
}

/** Proyección pública pura de un servicio: campo por campo, nada interno. */
export function formatPublicService(row: OfferedServicePureRow) {
  const withoutPrice = ZERO_AMOUNT_REGEX.test(row.price);
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.descriptionText,
    price: withoutPrice ? null : row.price,
    currency: withoutPrice ? null : row.currency,
    isActive: row.isActive,
  };
}

/** Proyección pública pura de un producto: campo por campo, nada interno. */
export function formatPublicProduct(row: PharmacyProductPureRow) {
  const presentation = [row.strengthText, row.packageSizeText]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(' · ');
  return {
    id: row.id,
    genericName: row.sortName,
    brandName: row.brandName,
    presentation: presentation === '' ? null : presentation,
    therapeuticGroup: null,
    price: row.price,
    currency: row.price === null ? null : row.currency,
    inStock: publicInStock(row),
    requiresPrescription: row.requiresPrescription === true,
  };
}
