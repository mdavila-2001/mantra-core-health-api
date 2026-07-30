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
