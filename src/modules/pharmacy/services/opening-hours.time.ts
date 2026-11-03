/**
 * La hora de los turnos de farmacia (P34), en un solo lugar.
 *
 * Bolivia tiene un único huso, UTC−4 todo el año (sin horario de verano), y se
 * escribe `America/La_Paz`. La base guarda instantes (`timestamptz`); lo que
 * cambia de una sede a otra es **cómo se muestra** ese instante, y eso lo decide
 * `practice.practice_sites.time_zone` de la sede, con `America/La_Paz` cuando la
 * sede no declaró ninguno o declaró uno que el motor de `Intl` no conoce.
 *
 * Por qué la respuesta trae el huso y la hora local además del instante UTC:
 * quien abre la lista a las 3 de la mañana no tiene por qué saber restar cuatro
 * horas, y un cliente que formatea con el huso del navegador mostraría otra
 * hora a alguien que mira desde el exterior por un familiar.
 */

/** Huso por defecto de una sede de farmacia: el de Bolivia. */
export const BOLIVIA_TIME_ZONE = 'America/La_Paz';

/** Lo más largo que puede durar un turno (el mismo techo que el CHECK del modelo). */
export const MAX_ON_CALL_SHIFT_HOURS = 72;

/** Con cuánta anticipación, como mucho, se declara un turno. */
export const MAX_ON_CALL_SHIFT_LEAD_DAYS = 62;

/**
 * Un instante ISO-8601 con desplazamiento **explícito** (`Z` o `±hh:mm`).
 *
 * Sin desplazamiento, `2026-10-26T20:00` es ambiguo: el servidor lo leería en su
 * propio huso (UTC en producción) y el turno quedaría corrido cuatro horas. Por
 * eso el contrato lo exige en vez de adivinarlo.
 */
export const ISO_INSTANT_WITH_OFFSET =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;

/**
 * El huso con que se muestra una sede.
 *
 * @param declared - `practice_sites.time_zone` de la sede, si lo tiene.
 * @returns Un huso IANA válido; `America/La_Paz` si el declarado falta o no existe.
 */
export function siteTimeZone(declared: string | null | undefined): string {
  const candidate = declared?.trim();
  if (!candidate) return BOLIVIA_TIME_ZONE;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: candidate });
    return candidate;
  } catch {
    return BOLIVIA_TIME_ZONE;
  }
}

/**
 * El instante en la hora local de un huso, como ISO-8601 con su desplazamiento
 * (`2026-10-26T20:00:00-04:00`).
 *
 * @param instant - Instante a mostrar.
 * @param timeZone - Huso IANA (ya validado con {@link siteTimeZone}).
 * @returns El mismo instante escrito en la hora local del huso.
 */
export function toZonedIso(instant: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'longOffset',
  }).formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((p) => p.type === type)?.value ?? '';
  // `longOffset` escribe «GMT-04:00», o «GMT» a secas en UTC.
  const offset = part('timeZoneName').replace('GMT', '') || '+00:00';
  return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}:${part('second')}${offset}`;
}

/** Por qué una ventana de turno no se acepta. */
export type OnCallWindowProblem =
  'END_NOT_AFTER_START' | 'TOO_LONG' | 'ALREADY_ENDED' | 'TOO_FAR_AHEAD';

/**
 * Valida la ventana de un turno nuevo (D3 del P34: un turno vencido o sin fin
 * nunca se publica).
 *
 * @param startsAt - Inicio.
 * @param endsAt - Fin, exclusivo.
 * @param now - El instante de referencia.
 * @returns El problema, o `null` si la ventana es válida.
 */
export function onCallWindowProblem(
  startsAt: Date,
  endsAt: Date,
  now: Date,
): OnCallWindowProblem | null {
  const hour = 3_600_000;
  if (endsAt.getTime() <= startsAt.getTime()) return 'END_NOT_AFTER_START';
  if (endsAt.getTime() - startsAt.getTime() > MAX_ON_CALL_SHIFT_HOURS * hour) {
    return 'TOO_LONG';
  }
  if (endsAt.getTime() <= now.getTime()) return 'ALREADY_ENDED';
  if (
    startsAt.getTime() - now.getTime() >
    MAX_ON_CALL_SHIFT_LEAD_DAYS * 24 * hour
  ) {
    return 'TOO_FAR_AHEAD';
  }
  return null;
}
