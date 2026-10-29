/**
 * Aritmética de días y medianoches en la zona horaria de la sede.
 *
 * La regla de medianoche (D7) se define en hora local del establecimiento: el
 * 00:00 de la sede, no el de UTC. Las funciones son puras y sólo usan `Intl`.
 */

/** `YYYY-MM-DD` de un instante en la zona de la sede. */
export function localDate(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);
}

/** Suma `days` (negativo resta) a un día `YYYY-MM-DD`, en calendario civil. */
export function addDays(isoDay: string, days: number): string {
  const shifted = new Date(
    Date.UTC(
      Number(isoDay.slice(0, 4)),
      Number(isoDay.slice(5, 7)) - 1,
      Number(isoDay.slice(8, 10)) + days,
    ),
  );
  return shifted.toISOString().slice(0, 10);
}

/** ¿`value` es un día `YYYY-MM-DD` del calendario real? */
export function isIsoDay(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

/** Desfase de la zona en un instante: hora de pared (como si fuera UTC) menos el instante. */
function offsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant);
  const field = (type: string): number =>
    Number(parts.find((part) => part.type === type)?.value);
  const wall = Date.UTC(
    field('year'),
    field('month') - 1,
    field('day'),
    field('hour'),
    field('minute'),
    field('second'),
  );
  return wall - Math.floor(instant.getTime() / 1000) * 1000;
}

/**
 * Instante en que empieza `isoDay` (00:00 local) en la zona de la sede.
 *
 * Dos pasadas bastan para zonas con horario de verano; en una zona donde la
 * medianoche no existe (salto de reloj a las 00:00) devuelve el primer instante
 * posterior.
 */
export function localMidnight(isoDay: string, timeZone: string): Date {
  const wall = Date.UTC(
    Number(isoDay.slice(0, 4)),
    Number(isoDay.slice(5, 7)) - 1,
    Number(isoDay.slice(8, 10)),
  );
  let guess = wall - offsetMs(new Date(wall), timeZone);
  guess = wall - offsetMs(new Date(guess), timeZone);
  return new Date(guess);
}

/** Zona IANA válida para `Intl`. */
export function isValidTimeZone(timeZone: string | null | undefined): boolean {
  if (!timeZone) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}
