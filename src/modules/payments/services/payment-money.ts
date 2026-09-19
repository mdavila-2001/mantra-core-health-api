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
 * @param texto - Importe como cadena.
 * @returns La representación escalada.
 * @throws RangeError si no es un decimal.
 */
function escalar(texto: string): Escalado {
  const limpio = texto.trim();
  if (!/^[+-]?\d+(\.\d+)?$/.test(limpio)) {
    throw new RangeError(`Importe no decimal: ${texto}`);
  }
  const negativo = limpio.startsWith('-');
  const [entera, fraccion = ''] = limpio.replace(/^[+-]/, '').split('.');
  const valor = BigInt(`${entera}${fraccion}`);
  return { valor: negativo ? -valor : valor, decimales: fraccion.length };
}

/**
 * Suma importes; la lista vacía suma cero.
 *
 * @param importes - Importes como cadena.
 * @returns La suma, con la escala de la entrada más precisa.
 */
export function sumarImportes(importes: readonly string[]): string {
  return sumarDecimales(importes) ?? '0';
}

/**
 * `a - b` exacto.
 *
 * @param a - Minuendo.
 * @param b - Sustraendo.
 * @returns La diferencia como cadena decimal (puede ser negativa).
 */
export function restarImportes(a: string, b: string): string {
  const limpio = b.trim().replace(/^\+/, '');
  const opuesto = limpio.startsWith('-') ? limpio.slice(1) : `-${limpio}`;
  return sumarImportes([a, opuesto]);
}

/**
 * Compara dos importes por valor: `'0.3'` y `'0.30'` son iguales.
 *
 * @param a - Primer importe.
 * @param b - Segundo importe.
 * @returns -1 si `a < b`, 0 si son iguales, 1 si `a > b`.
 */
export function compararImportes(a: string, b: string): -1 | 0 | 1 {
  const ea = escalar(a);
  const eb = escalar(b);
  const decimales = Math.max(ea.decimales, eb.decimales);
  const va = ea.valor * 10n ** BigInt(decimales - ea.decimales);
  const vb = eb.valor * 10n ** BigInt(decimales - eb.decimales);
  if (va === vb) return 0;
  return va < vb ? -1 : 1;
}

/**
 * `true` si el importe es un decimal estrictamente mayor que cero.
 *
 * @param importe - Importe como cadena.
 * @returns Si es positivo; `false` también para texto que no es decimal.
 */
export function esImportePositivo(importe: string): boolean {
  try {
    return compararImportes(importe, '0') > 0;
  } catch {
    return false;
  }
}
