/**
 * Utilidades de dinero para el módulo Billing.
 *
 * Los importes se persisten como `numeric` (string) para no perder precisión. Se
 * operan con enteros de centavos y se serializan con dos decimales. No es una
 * librería de dinero completa (no maneja monedas ni redondeo bancario), solo lo
 * suficiente para sumar líneas y calcular saldos de forma determinista.
 */

/** Convierte un string/number monetario a centavos enteros. */
export function toCents(value: string | number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

/** Formatea centavos enteros como string `numeric` con dos decimales. */
export function fromCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

/** Suma una lista de importes (strings/numbers) y devuelve el string con 2 decimales. */
export function sumAmounts(values: Array<string | number | undefined>): string {
  const cents = values.reduce<number>(
    (acc, v) => acc + (v == null ? 0 : toCents(v)),
    0,
  );
  return fromCents(cents);
}

/**
 * Importe no negativo con hasta 13 dígitos enteros y 2 decimales. El tope de
 * dígitos mantiene los centavos dentro de los enteros exactos de JavaScript.
 */
export const MONEY_PATTERN = /^\d{1,13}(\.\d{1,2})?$/;

/** Cantidad no negativa con hasta 10 dígitos enteros y 4 decimales. */
export const QUANTITY_PATTERN = /^\d{1,10}(\.\d{1,4})?$/;

/**
 * Convierte un importe decimal a centavos **sin pasar por coma flotante**.
 *
 * Es la contraparte estricta de {@link toCents}: aquella tolera cualquier cosa
 * (un `NaN` vale cero y un signo negativo pasa), y por eso no sirve para validar.
 *
 * @param value - Texto del importe.
 * @returns Los centavos, o `null` si no es un importe no negativo con a lo sumo
 *   dos decimales.
 */
export function exactCents(value: string | undefined | null): number | null {
  if (typeof value !== 'string' || !MONEY_PATTERN.test(value)) return null;
  const [whole, fraction = ''] = value.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}

/**
 * Base de una línea (`cantidad * precio unitario`) en centavos, con decimal
 * exacto y redondeo half-up al centavo.
 *
 * @param quantity - Cantidad (hasta 4 decimales).
 * @param unitPrice - Precio unitario (hasta 2 decimales).
 * @returns Los centavos, o `null` si algún operando es inválido o el resultado
 *   no cabe en un entero exacto.
 */
export function lineBaseCents(
  quantity: string | undefined | null,
  unitPrice: string | undefined | null,
): number | null {
  if (typeof quantity !== 'string' || !QUANTITY_PATTERN.test(quantity)) {
    return null;
  }
  const priceCents = exactCents(unitPrice);
  if (priceCents === null) return null;
  const [whole, fraction = ''] = quantity.split('.');
  const scaled = BigInt(`${whole}${fraction.padEnd(4, '0')}`);
  const base = (scaled * BigInt(priceCents) + 5000n) / 10000n;
  return base > BigInt(Number.MAX_SAFE_INTEGER) ? null : Number(base);
}
