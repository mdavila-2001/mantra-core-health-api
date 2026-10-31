import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/errors/domain.exception';
import { ErrorCode } from '../../../common/errors/error-codes';
import { ObservabilityErrorReason } from '../observability.error-reasons';

/**
 * Ventana de las lecturas del portal «Sistema».
 *
 * Distinta de `resolveWindow` (analítica de producto) en tres cosas que pidió el
 * portal: la zona horaria es un **parámetro** (`tz`, por defecto
 * `America/La_Paz`, D-01) y la respuesta la declara siempre; «hoy» arranca a las
 * 00:00 de esa zona; y hay cubos por **minuto** (≤ 24 h).
 *
 * Ventana inválida → 422 `VALIDATION_FAILED` con `reason`.
 */

export type ObsInterval = 'minute' | 'hour' | 'day';

export const DEFAULT_TIMEZONE = 'America/La_Paz';
export const MAX_WINDOW_DAYS = 92;
export const MAX_MINUTE_WINDOW_HOURS = 24;
export const MAX_HOURLY_WINDOW_DAYS = 7;
const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

export interface ObsWindow {
  readonly from: Date;
  readonly to: Date;
  readonly interval: ObsInterval;
  readonly timezone: string;
}

function invalid(
  reason: ObservabilityErrorReason,
  message: string,
): DomainException {
  return new DomainException(
    HttpStatus.UNPROCESSABLE_ENTITY,
    ErrorCode.VALIDATION_FAILED,
    message,
    undefined,
    reason,
  );
}

/** ¿Es una zona IANA que el runtime conoce? */
/** ISO-8601 estricto (fecha o fecha-hora); lo demás es `Invalid Date`. */
function parseIso(value: string): Date {
  return /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,6})?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/.test(
    value,
  )
    ? new Date(value)
    : new Date(Number.NaN);
}

export function isValidTimezone(tz: string): boolean {
  if (typeof tz !== 'string' || tz.length === 0 || tz.length > 64) return false;
  if (!/^[A-Za-z0-9_+\-/]+$/.test(tz)) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Desplazamiento (ms) de la zona respecto de UTC en el instante dado. */
function offsetMs(instant: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant);
  const get = (type: string): number =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second'),
  );
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

/** Las 00:00 de la zona en el día local de `instant`. */
export function startOfLocalDay(instant: Date, tz: string): Date {
  const local = new Date(instant.getTime() + offsetMs(instant, tz));
  const localMidnightAsUtc = Date.UTC(
    local.getUTCFullYear(),
    local.getUTCMonth(),
    local.getUTCDate(),
  );
  // Primera aproximación con el desplazamiento de `instant`; se corrige con el
  // que rige a esa hora (cambios de horario).
  let guess = new Date(localMidnightAsUtc - offsetMs(instant, tz));
  guess = new Date(localMidnightAsUtc - offsetMs(guess, tz));
  return guess;
}

export function resolveObsWindow(
  input: { from?: string; to?: string; tz?: string; interval?: ObsInterval },
  now: Date = new Date(),
): ObsWindow {
  const timezone = input.tz ?? DEFAULT_TIMEZONE;
  if (!isValidTimezone(timezone)) {
    throw invalid(
      ObservabilityErrorReason.INVALID_TIMEZONE,
      'La zona horaria no es una zona IANA válida',
    );
  }

  const to = input.to ? parseIso(input.to) : now;
  if (Number.isNaN(to.getTime())) {
    throw invalid(
      ObservabilityErrorReason.INVALID_DATE,
      'Fecha de ventana no válida',
    );
  }
  let from: Date;
  if (input.from) {
    from = parseIso(input.from);
  } else {
    const startOfDay = startOfLocalDay(to, timezone);
    // `to` justo a medianoche: el «hoy» ya terminó, se mira el día anterior.
    from =
      startOfDay.getTime() < to.getTime()
        ? startOfDay
        : startOfLocalDay(new Date(to.getTime() - 1), timezone);
  }
  if (Number.isNaN(from.getTime())) {
    throw invalid(
      ObservabilityErrorReason.INVALID_DATE,
      'Fecha de ventana no válida',
    );
  }
  if (from.getTime() >= to.getTime()) {
    throw invalid(
      ObservabilityErrorReason.EMPTY_WINDOW,
      '"from" debe ser anterior a "to"',
    );
  }
  const span = to.getTime() - from.getTime();
  if (span > MAX_WINDOW_DAYS * DAY_MS) {
    throw invalid(
      ObservabilityErrorReason.WINDOW_TOO_LARGE,
      `La ventana máxima es de ${MAX_WINDOW_DAYS} días`,
    );
  }

  const interval: ObsInterval =
    input.interval ??
    (span <= 2 * HOUR_MS
      ? 'minute'
      : span <= MAX_HOURLY_WINDOW_DAYS * DAY_MS
        ? 'hour'
        : 'day');
  if (interval === 'minute' && span > MAX_MINUTE_WINDOW_HOURS * HOUR_MS) {
    throw invalid(
      ObservabilityErrorReason.INTERVAL_TOO_FINE,
      `El intervalo por minuto admite ventanas de hasta ${MAX_MINUTE_WINDOW_HOURS} horas`,
    );
  }
  if (interval === 'hour' && span > MAX_HOURLY_WINDOW_DAYS * DAY_MS) {
    throw invalid(
      ObservabilityErrorReason.INTERVAL_TOO_FINE,
      `El intervalo por hora admite ventanas de hasta ${MAX_HOURLY_WINDOW_DAYS} días`,
    );
  }
  return { from, to, interval, timezone };
}

export function windowView(window: ObsWindow) {
  return {
    from: window.from.toISOString(),
    to: window.to.toISOString(),
    interval: window.interval,
    timezone: window.timezone,
  };
}
