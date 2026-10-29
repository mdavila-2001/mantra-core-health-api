/**
 * El driver de PostgreSQL entrega `timestamptz` como el texto de Postgres
 * (`2026-10-21 15:02:26.892+00`), no como `Date` ni como ISO 8601. Eso no es un formato de fecha
 * que un navegador interprete igual en todos lados, así que toda fecha que sale por la API pasa
 * por aquí.
 */
const TEXTO_PG =
  /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(\.\d+)?(?:Z|([+-]\d{2})(?::?(\d{2}))?)?$/;

/** ISO 8601 (UTC, milisegundos) de lo que devuelve el driver. */
export function iso(valor: string | Date): string {
  if (valor instanceof Date) return valor.toISOString();
  const m = TEXTO_PG.exec(valor.trim());
  if (!m)
    throw new TypeError(`Fecha con formato desconocido: ${String(valor)}`);
  const [, dia, hora, fraccion = '', hh, mm] = m;
  const zona = hh ? `${hh}:${mm ?? '00'}` : 'Z';
  const fecha = new Date(`${dia}T${hora}${fraccion.slice(0, 4)}${zona}`);
  if (Number.isNaN(fecha.getTime()))
    throw new TypeError(`Fecha inválida: ${String(valor)}`);
  return fecha.toISOString();
}

export function isoOrNull(
  valor: string | Date | null | undefined,
): string | null {
  return valor === null || valor === undefined ? null : iso(valor);
}
