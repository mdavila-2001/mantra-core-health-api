import type {
  PharmacyPriceLists,
  PharmacyProductPrices,
} from '../../pharmacy/entities';

/**
 * La aritmética y la elección de precios del módulo 25, compartidas.
 *
 * Nacieron dentro de la lectura de disponibilidad (E2) y se extrajeron cuando
 * el pedido empezó a **congelar** precios (cierre de farmacia, v4.2.1): elegir
 * qué precio aplica y sumar dinero decimal no pueden tener dos versiones — un
 * total congelado que no coincide con el comparador es un precio que miente.
 *
 * Todo importe viaja como string `numeric` de BD: el punto flotante binario no
 * sabe sumar dinero decimal, así que acá se escala a enteros (`bigint`) y se
 * redondea half-up a 2 decimales, el formato del contrato.
 */

/** Un precio vigente con la lista que lo publica: la unidad de decisión. */
export interface PriceCandidate {
  /** La versión de precio vigente. */
  readonly price: PharmacyProductPrices;
  /** La lista que la publica (trae moneda y alcance de sede). */
  readonly list: PharmacyPriceLists;
}

/**
 * El precio ganador de un producto en una sede: gana la lista propia de la
 * sede sobre la lista general de la farmacia; a igualdad, el más barato para
 * el paciente. Devuelve el par crudo — quien congela necesita el
 * `currency_concept_id` de la lista, no su etiqueta.
 */
export function winningPriceFor(
  productId: string,
  siteId: string,
  prices: readonly PharmacyProductPrices[],
  listById: ReadonlyMap<string, PharmacyPriceLists>,
): PriceCandidate | null {
  const candidates = prices
    .filter((price) => price.pharmacyProductId === productId)
    .map((price) => ({ price, list: listById.get(price.pharmacyPriceListId) }))
    .filter(
      (candidate): candidate is PriceCandidate =>
        candidate.list !== undefined &&
        (!candidate.list.pharmacySiteId ||
          candidate.list.pharmacySiteId === siteId),
    )
    .sort((a, b) => {
      const aSiteSpecific = a.list.pharmacySiteId ? 0 : 1;
      const bSiteSpecific = b.list.pharmacySiteId ? 0 : 1;
      if (aSiteSpecific !== bSiteSpecific) return aSiteSpecific - bSiteSpecific;
      return (
        numericOf(payableAmount(a.price)) - numericOf(payableAmount(b.price))
      );
    });

  return candidates[0] ?? null;
}

/** Lo que efectivamente paga el paciente: su tarifa si la lista la distingue. */
export function payableAmount(price: PharmacyProductPrices): string {
  return price.patientAmount ?? price.unitAmount;
}

/** Un importe `numeric` de BD bien formado: dígitos y a lo sumo un punto. */
const DECIMAL_PATTERN = /^-?\d+(?:\.\d+)?$/;

/** Cuántos decimales trae un importe. */
function decimalsOf(value: string): number {
  const dot = value.indexOf('.');
  return dot === -1 ? 0 : value.length - dot - 1;
}

/** El importe como entero a la escala dada; lo ilegible cuenta 0. */
function scaledAmount(value: string, scale: number): bigint {
  if (!DECIMAL_PATTERN.test(value)) return 0n;
  const negative = value.startsWith('-');
  const [whole, fraction = ''] = (negative ? value.slice(1) : value).split('.');
  const digits = whole + fraction.padEnd(scale, '0').slice(0, scale);
  return negative ? -BigInt(digits) : BigInt(digits);
}

/** Un entero escalado, devuelto a texto con 2 decimales (half-up). */
function toMoney(total: bigint, scale: number): string {
  const rest = 10n ** BigInt(Math.max(0, scale - 2));
  const half = total < 0n ? -(rest / 2n) : rest / 2n;
  const cents =
    scale > 2 ? (total + half) / rest : total * 10n ** BigInt(2 - scale);
  const sign = cents < 0n ? '-' : '';
  const abs = cents < 0n ? -cents : cents;
  return `${sign}${(abs / 100n).toString()}.${(abs % 100n).toString().padStart(2, '0')}`;
}

/**
 * Suma exacta de importes `numeric`: se alinean los decimales y se suma en
 * enteros. El resultado se sirve con 2 decimales (half-up).
 */
export function sumAmounts(values: readonly string[]): string {
  const amounts = values.map((value) => value.trim());
  const scale = Math.max(2, ...amounts.map(decimalsOf));
  const total = amounts.reduce(
    (sum, amount) => sum + scaledAmount(amount, scale),
    0n,
  );
  return toMoney(total, scale);
}

/**
 * Producto exacto de dos `numeric` (precio unitario × cantidad), a 2
 * decimales half-up. Mismo motivo que la suma: `3 × 33.34` en flotante no es
 * un importe, es una aproximación.
 */
export function multiplyAmounts(a: string, b: string): string {
  const [left, right] = [a.trim(), b.trim()];
  if (!DECIMAL_PATTERN.test(left) || !DECIMAL_PATTERN.test(right)) {
    return '0.00';
  }
  const scaleA = decimalsOf(left);
  const scaleB = decimalsOf(right);
  const product = scaledAmount(left, scaleA) * scaledAmount(right, scaleB);
  return toMoney(product, scaleA + scaleB);
}

/** Un importe como número, solo para COMPARAR (jamás para sumar dinero). */
function numericOf(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
