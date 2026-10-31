/**
 * Tiempo en la zona de la organización para las condiciones de apoyo
 * (CONTRATO-GOBIERNO §3.4): ventanas horarias, límites de día/semana y rangos
 * de fechas. Todo FALLA CERRADO: un dato roto da «indeterminado» (nunca abre).
 *
 * No reutiliza `iam/domain/session-policy.ts`, que falla ABIERTO (allí un fallo
 * cerraría el inicio de sesión de toda la organización; aquí solo cierra un
 * permiso). Deuda anotada: extraer ambos a `src/common/` cuando alguien lo pida.
 */

/** Zona por defecto: la misma de `iam/domain/session-policy.ts`. */
export const DEFAULT_TIME_ZONE = 'America/La_Paz';

const DAY_MS = 86_400_000;
const HH_MM = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
const WEEKDAYS: Readonly<Record<string, number>> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/** Una ventana horaria: días 0-6 (0 = domingo) y `[from, to)` en `HH:mm`. */
export interface TimeWindow {
  readonly days: readonly number[];
  readonly from: string;
  readonly to: string;
}

/** Fecha y hora local descompuestas. */
export interface ZonedParts {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
  /** 0 = domingo … 6 = sábado. */
  readonly weekday: number;
}

const formatters = new Map<string, Intl.DateTimeFormat | null>();

function formatterFor(zone: string): Intl.DateTimeFormat | undefined {
  if (typeof zone !== 'string' || zone.trim() === '') return undefined;
  const cached = formatters.get(zone);
  if (cached !== undefined) return cached ?? undefined;
  try {
    const created = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      hourCycle: 'h23',
      weekday: 'short',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatters.set(zone, created);
    return created;
  } catch {
    formatters.set(zone, null);
    return undefined;
  }
}

/** ¿Es `zone` una zona horaria IANA que el motor conoce? */
export function isValidTimeZone(zone: string): boolean {
  return formatterFor(zone) !== undefined;
}

/**
 * Descompone un instante en hora local.
 *
 * @param date - Instante.
 * @param zone - Zona IANA.
 * @returns La fecha y hora locales; `undefined` si la zona no es válida o la
 *   fecha no existe.
 */
export function zonedParts(date: Date, zone: string): ZonedParts | undefined {
  const formatter = formatterFor(zone);
  if (!formatter || !(date instanceof Date) || Number.isNaN(date.getTime())) {
    return undefined;
  }
  const bag: Record<string, string> = {};
  for (const part of formatter.formatToParts(date)) bag[part.type] = part.value;
  const weekday = WEEKDAYS[bag.weekday];
  if (weekday === undefined) return undefined;
  return {
    year: Number(bag.year),
    month: Number(bag.month),
    day: Number(bag.day),
    hour: Number(bag.hour),
    minute: Number(bag.minute),
    second: Number(bag.second),
    weekday,
  };
}

/** Minutos desde la medianoche de `HH:mm`; `undefined` si el formato no es válido. */
function minutesOf(value: unknown): number | undefined {
  if (typeof value !== 'string' || !HH_MM.test(value)) return undefined;
  return Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5));
}

function windowIsWellFormed(w: TimeWindow): boolean {
  if (!Array.isArray(w.days) || w.days.length === 0) return false;
  if (!w.days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)) {
    return false;
  }
  const from = minutesOf(w.from);
  const to = minutesOf(w.to);
  // `from == to` es la franja vacía que la revisión N2 encontró: inválida.
  return from !== undefined && to !== undefined && from !== to;
}

/**
 * Evalúa las ventanas con lógica de tres valores. `T` si alguna contiene el
 * instante; `F` si todas están bien formadas y ninguna lo contiene; `I` si hay
 * una zona inválida, no hay ventanas o alguna ventana rota sin que otra baste.
 *
 * Reglas del contrato: intervalo semiabierto `[from, to)`; `from > to` cruza la
 * medianoche y el día de la ventana es el día en que EMPIEZA.
 *
 * @param windows - Ventanas de la condición.
 * @param now - Instante de la decisión.
 * @param timeZone - Zona IANA en que se leen las ventanas.
 * @returns `T`, `F` o `I`.
 */
export function evaluateWindows(
  windows: readonly TimeWindow[] | undefined,
  now: Date,
  timeZone: string,
): 'T' | 'F' | 'I' {
  // El dato viene de un JSON: si no es una lista, es un dato roto (indeterminado).
  const raw: unknown = windows;
  if (!windows || !Array.isArray(raw) || windows.length === 0) return 'I';
  const parts = zonedParts(now, timeZone);
  if (!parts) return 'I';
  const minute = parts.hour * 60 + parts.minute;
  const yesterday = (parts.weekday + 6) % 7;
  let broken = false;
  for (const w of windows) {
    if (!w || !windowIsWellFormed(w)) {
      broken = true;
      continue;
    }
    const from = minutesOf(w.from) as number;
    const to = minutesOf(w.to) as number;
    const inside =
      from < to
        ? w.days.includes(parts.weekday) && minute >= from && minute < to
        : (w.days.includes(parts.weekday) && minute >= from) ||
          (w.days.includes(yesterday) && minute < to);
    if (inside) return 'T';
  }
  return broken ? 'I' : 'F';
}

/** Versión booleana de `evaluateWindows`: lo indeterminado cuenta como fuera. */
export function isWithinWindows(
  windows: readonly TimeWindow[] | undefined,
  now: Date,
  timeZone: string,
): boolean {
  return evaluateWindows(windows, now, timeZone) === 'T';
}

/** Diferencia entre la hora local (leída como UTC) y el instante, en ms. */
function offsetMs(instant: Date, zone: string): number | undefined {
  const p = zonedParts(instant, zone);
  if (!p) return undefined;
  const local = Date.UTC(
    p.year,
    p.month - 1,
    p.day,
    p.hour,
    p.minute,
    p.second,
  );
  return local - Math.floor(instant.getTime() / 1000) * 1000;
}

/**
 * Medianoche local del día de `date` desplazado `plusDays` días.
 *
 * @param date - Instante de referencia.
 * @param zone - Zona IANA.
 * @param plusDays - Días a sumar (puede ser negativo).
 * @returns El instante de las 00:00 locales; `undefined` si la zona no vale.
 */
export function startOfZonedDay(
  date: Date,
  zone: string,
  plusDays = 0,
): Date | undefined {
  const p = zonedParts(date, zone);
  if (!p) return undefined;
  const civil = Date.UTC(p.year, p.month - 1, p.day + plusDays);
  const first = offsetMs(new Date(civil), zone);
  if (first === undefined) return undefined;
  // Dos pasadas: el desfase puede cambiar entre el instante supuesto y el real.
  const second = offsetMs(new Date(civil - first), zone) ?? first;
  return new Date(civil - second);
}

/** Inicio del día siguiente al de `date` + `plusDays` (el fin del día, excluyente). */
export function endOfZonedDayExclusive(
  date: Date,
  zone: string,
  plusDays = 0,
): Date | undefined {
  return startOfZonedDay(date, zone, plusDays + 1);
}

/** Periodo de un límite. */
export type TimePeriod = 'HOUR' | 'DAY' | 'WEEK';

/** Semana ISO (`2026-W45`) del día civil `year-month-day`. */
function isoWeekKey(year: number, month: number, day: number): string {
  const date = Date.UTC(year, month - 1, day);
  const dow = (new Date(date).getUTCDay() + 6) % 7; // lunes = 0
  const thursday = date + (3 - dow) * DAY_MS;
  const isoYear = new Date(thursday).getUTCFullYear();
  const jan4 = Date.UTC(isoYear, 0, 4);
  const jan4Dow = (new Date(jan4).getUTCDay() + 6) % 7;
  const week1Thursday = jan4 + (3 - jan4Dow) * DAY_MS;
  const week = 1 + Math.round((thursday - week1Thursday) / (7 * DAY_MS));
  return `${isoYear}-W${String(week).padStart(2, '0')}`;
}

/**
 * Identificador del periodo que contiene `date` en la zona de la organización:
 * el día calendario (`2026-11-03`), la semana ISO (`2026-W45`) o, para la
 * ventana deslizante de una hora, la constante `sliding-60m`.
 */
export function periodKey(
  per: TimePeriod,
  date: Date,
  zone: string,
): string | undefined {
  if (per === 'HOUR') return 'sliding-60m';
  const p = zonedParts(date, zone);
  if (!p) return undefined;
  if (per === 'DAY') {
    const mm = String(p.month).padStart(2, '0');
    const dd = String(p.day).padStart(2, '0');
    return `${p.year}-${mm}-${dd}`;
  }
  return isoWeekKey(p.year, p.month, p.day);
}

/**
 * Cuándo se renueva un contador: la medianoche local siguiente (`DAY`), el
 * lunes siguiente a las 00:00 locales (`WEEK`) o dentro de una hora (`HOUR`,
 * ventana deslizante: cota superior).
 */
export function nextResetAt(
  per: TimePeriod,
  now: Date,
  zone: string,
): Date | undefined {
  if (per === 'HOUR') return new Date(now.getTime() + 3_600_000);
  if (per === 'DAY') return startOfZonedDay(now, zone, 1);
  const p = zonedParts(now, zone);
  if (!p) return undefined;
  const toMonday = (8 - p.weekday) % 7 || 7;
  return startOfZonedDay(now, zone, toMonday);
}
