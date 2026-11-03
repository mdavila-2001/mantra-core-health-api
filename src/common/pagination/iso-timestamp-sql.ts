/**
 * Fragmento SQL que presenta un `timestamptz` como ISO 8601 UTC con microsegundos
 * (`2026-10-24T11:00:00.123456Z`).
 *
 * El mismo texto sirve para mostrar la fecha y como componente de un cursor keyset: no pierde la
 * precisión con que Postgres ordena, que un `Date` de JavaScript (milisegundos) sí pierde.
 *
 * @param columna - Expresión SQL de tipo `timestamptz` (p. ej. `a.recorded_at`). No es un
 *   parámetro: se interpola, así que sólo recibe identificadores escritos en el código.
 */
export function isoTimestampSql(columna: string): string {
  return `to_char(${columna} at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`;
}
