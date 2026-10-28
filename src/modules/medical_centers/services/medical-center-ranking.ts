/**
 * Lo único que decide el orden de los resultados.
 *
 * El tipo no tiene `practitionerWorksHere` ni `suggestedByPractitioner` a
 * propósito: el vínculo del médico con un centro nunca mueve su posición. El
 * orden es el mismo para todos los pacientes.
 */
export interface RankableCenter {
  /** Ofrece todo lo pedido. */
  readonly complete: boolean;
  /** Kilómetros en línea recta, o `null` sin distancia. */
  readonly distanceKm: number | null;
  /** Suma de lo que ofrece de lo pedido, o `null`. */
  readonly totalPrice: number | null;
  /** Nombre de la sede. */
  readonly name: string;
}

/**
 * Compara dos centros: completos primero, después el más cercano (sin
 * distancia, al final), después el de menor precio total (sin total, al final)
 * y por último el nombre.
 *
 * @param a - Primer centro.
 * @param b - Segundo centro.
 * @returns Negativo si `a` va antes, positivo si va después.
 */
export function compareMedicalCenters(
  a: RankableCenter,
  b: RankableCenter,
): number {
  if (a.complete !== b.complete) return a.complete ? -1 : 1;
  const byDistance = compareNullsLast(a.distanceKm, b.distanceKm);
  if (byDistance !== 0) return byDistance;
  const byPrice = compareNullsLast(a.totalPrice, b.totalPrice);
  if (byPrice !== 0) return byPrice;
  return a.name.localeCompare(b.name, 'es');
}

/**
 * Orden ascendente de dos números con `null` al final.
 *
 * @param a - Primer valor.
 * @param b - Segundo valor.
 * @returns El signo de la comparación; cero si empatan.
 */
function compareNullsLast(a: number | null, b: number | null): number {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a - b;
}
