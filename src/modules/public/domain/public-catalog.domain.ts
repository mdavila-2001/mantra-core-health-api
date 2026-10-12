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
    inStock: Number(row.availableQuantity) > 0,
    requiresPrescription: row.requiresPrescription === true,
  };
}
