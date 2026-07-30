/**
 * Utilidades numéricas para importes contables.
 *
 * Los importes viajan como cadenas (`numeric` de PostgreSQL) para no perder
 * precisión al deserializar. Para comparar saldos se trabaja en "centésimas"
 * enteras redondeadas, evitando el ruido de coma flotante que haría fallar la
 * validación debe=haber por diferencias de 1e-9.
 */

/** Convierte un importe a un entero de centésimas (2 decimales) redondeado. */
export function toCents(amount: string | number): number {
  const n = typeof amount === 'number' ? amount : Number(amount);
  if (!Number.isFinite(n)) {
    throw new Error(`Importe no numérico: ${String(amount)}`);
  }
  return Math.round(n * 100);
}

/** Suma una lista de importes y devuelve el total en centésimas. */
export function sumCents(amounts: Array<string | number>): number {
  return amounts.reduce<number>((acc, a) => acc + toCents(a), 0);
}

/** Formatea centésimas a una cadena con 2 decimales. */
export function fromCents(cents: number): string {
  return (cents / 100).toFixed(2);
}
