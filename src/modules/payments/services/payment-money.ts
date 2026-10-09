import { sumarDecimales } from '../../../common';

/**
 * Aritmética exacta de importes de pagos (MCH-017).
 *
 * Los importes llegan como cadena (`numeric` de PostgreSQL o el DTO) y así se
 * tratan: nada pasa por `Number`. Con coma flotante, 0.10 + 0.20 da
 * 0.30000000000000004 y un reembolso válido de 0.20 sobre 0.30 capturado
 * quedaba rechazado; un epsilon lo taparía y dejaría pasar excesos reales.
 *
 * La suma reusa `sumarDecimales` de `common/money`. Acá se agregan la
 * comparación y la resta, que ese módulo no ofrece, con la misma técnica:
 * `BigInt` sobre la representación decimal literal, cualquiera sea la escala
 * de la moneda (0, 2 o 3 decimales).
 */

/** Importe escalado a un entero y cuántos decimales tenía. */
interface Escalado {
  readonly valor: bigint;
  readonly decimales: number;
}

/**
 * Parte una cadena decimal en entero escalado + decimales.
 *
 * @param text - Importe como cadena.
 * @returns La representación escalada.
 * @throws RangeError si no es un decimal.
 */
function escalate(text: string): Escalado {
  const clean = text.trim();
  if (!/^[+-]?\d+(\.\d+)?$/.test(clean)) {
    throw new RangeError(`Importe no decimal: ${text}`);
  }
  const negative = clean.startsWith('-');
  const [entera, fraccion = ''] = clean.replace(/^[+-]/, '').split('.');
  const valor = BigInt(`${entera}${fraccion}`);
  return { valor: negative ? -valor : valor, decimales: fraccion.length };
}

/**
 * Suma importes; la lista vacía suma cero.
 *
 * @param amounts - Importes como cadena.
 * @returns La suma, con la escala de la entrada más precisa.
 */
export function addAmounts(amounts: readonly string[]): string {
  return sumarDecimales(amounts) ?? '0';
}

/**
 * `a - b` exacto.
 *
 * @param a - Minuendo.
 * @param b - Sustraendo.
 * @returns La diferencia como cadena decimal (puede ser negativa).
 */
export function subtractAmounts(a: string, b: string): string {
  const clean = b.trim().replace(/^\+/, '');
  const opposite = clean.startsWith('-') ? clean.slice(1) : `-${clean}`;
  return addAmounts([a, opposite]);
}

/**
 * Compara dos importes por valor: `'0.3'` y `'0.30'` son iguales.
 *
 * @param a - Primer importe.
 * @param b - Segundo importe.
 * @returns -1 si `a < b`, 0 si son iguales, 1 si `a > b`.
 */
export function compareAmounts(a: string, b: string): -1 | 0 | 1 {
  const ea = escalate(a);
  const eb = escalate(b);
  const decimals = Math.max(ea.decimales, eb.decimales);
  const va = ea.valor * 10n ** BigInt(decimals - ea.decimales);
  const vb = eb.valor * 10n ** BigInt(decimals - eb.decimales);
  if (va === vb) return 0;
  return va < vb ? -1 : 1;
}

/**
 * `true` si el importe es un decimal estrictamente mayor que cero.
 *
 * @param amount - Importe como cadena.
 * @returns Si es positivo; `false` también para texto que no es decimal.
 */
export function isPositiveAmount(amount: string): boolean {
  try {
    return compareAmounts(amount, '0') > 0;
  } catch {
    return false;
  }
}
