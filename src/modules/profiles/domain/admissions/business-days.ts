/**
 * Suma `days` días hábiles (lunes a viernes, en UTC) a una fecha.
 *
 * Avanza de a un día y cuenta sólo los que no son sábado ni domingo, así que
 * pedir 3 días a un sábado da el miércoles siguiente. Sin feriados: el
 * calendario de feriados bolivianos no está modelado y el plazo es un SLA
 * interno, no un término legal. Conserva la hora del día. La cuenta es la misma
 * que hace el backfill del patch v4.2.67 (`generate_series` con `isodow < 6`).
 *
 * @param from - Fecha de partida.
 * @param days - Días hábiles a sumar (>= 0).
 */
export function addBusinessDays(from: Date, days: number): Date {
  const result = new Date(from.getTime());
  let remaining = Math.max(0, Math.trunc(days));
  while (remaining > 0) {
    result.setUTCDate(result.getUTCDate() + 1);
    const weekday = result.getUTCDay();
    if (weekday !== 0 && weekday !== 6) remaining -= 1;
  }
  return result;
}

/**
 * Suma `months` meses calendario a una fecha (UTC), recortando el día al último
 * del mes de llegada (31 de enero + 1 mes = 28/29 de febrero).
 */
export function addMonthsUtc(from: Date, months: number): Date {
  const result = new Date(from.getTime());
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDay = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
  ).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}

/** Desfase fijo de America/La_Paz respecto de UTC, en horas (Bolivia no usa horario de verano). */
const LA_PAZ_UTC_OFFSET_HOURS = -4;

/**
 * Una fecha de calendario (`YYYY-MM-DD`) a partir de un valor `date` de la base,
 * que según el driver llega como texto o como `Date` en UTC.
 */
export function toDateOnly(value: Date | string): string {
  if (typeof value === 'string') return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

/**
 * El último instante de la fecha `valid_until` en America/La_Paz (UTC-4).
 *
 * `valid_until` es una fecha inclusiva: «vale hasta el 30» significa hasta el fin
 * del 30 en Bolivia, es decir las 03:59:59.999 UTC del 1.º. Convertirla como
 * medianoche UTC adelantaría el vencimiento cuatro horas.
 */
export function endOfDayLaPaz(value: Date | string): Date {
  const [year, month, day] = toDateOnly(value)
    .split('-')
    .map((part) => Number(part));
  return new Date(
    Date.UTC(year, month - 1, day, 24 - LA_PAZ_UTC_OFFSET_HOURS, 0, 0, 0) - 1,
  );
}

/** La fecha de calendario de hoy en America/La_Paz. */
export function todayLaPaz(now: Date): string {
  return toDateOnly(
    new Date(now.getTime() + LA_PAZ_UTC_OFFSET_HOURS * 3_600_000),
  );
}
