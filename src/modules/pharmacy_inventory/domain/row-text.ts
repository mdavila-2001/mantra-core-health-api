/** Texto de una columna del driver (los `uuid`/`varchar` llegan como texto; las fechas, como `Date`). */
export function str(value: unknown): string {
  if (typeof value === 'string') return value;
  if (
    typeof value === 'number' ||
    typeof value === 'bigint' ||
    typeof value === 'boolean'
  )
    return String(value);
  if (value instanceof Date) return value.toISOString();
  throw new TypeError('Valor de columna inesperado');
}

/** Como {@link str}, con `null` y `undefined` conservados como `null`. */
export function strOrNull(value: unknown): string | null {
  return value === null || value === undefined ? null : str(value);
}
