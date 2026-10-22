import { localTimeToUtc, type LocalDay } from '../time/scheduling-time';

/** Geometría de las franjas semanales: proyección sobre una semana de referencia y solapes. */
/** Milisegundos de un día del calendario. */
export const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** Los siete días de la semana, para nombrar la franja que choca. */
export const DAY_NAME: readonly string[] = [
  'domingo',
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
];

/**
 * Una semana concreta del calendario sobre la que proyectar franjas semanales.
 *
 * Las reglas de una plantilla no tienen fecha —dicen «los lunes»—, y dos horas
 * de pared de zonas distintas no se pueden comparar sin aterrizarlas en un
 * instante. Esta es esa tierra: siete fechas reales, una por día de la semana.
 */
export interface ReferenceWeek {
  /** Fecha del calendario de cada día de la semana, indexada 0 = domingo. */
  readonly dates: readonly LocalDay[];
  /** Domingo de la semana, como instante, para descartar plantillas vencidas. */
  readonly start: Date;
}

/**
 * La semana del calendario que contiene el instante dado.
 *
 * Las fechas se toman del calendario UTC porque lo único que se necesita de
 * ellas es que sean siete días consecutivos con el día de semana correcto: la
 * zona entra después, al convertir cada hora de pared sobre esas fechas.
 *
 * @param from - Instante de referencia.
 * @returns Las siete fechas de esa semana y su domingo.
 */
export function referenceWeek(from: Date): ReferenceWeek {
  const base = Date.UTC(
    from.getUTCFullYear(),
    from.getUTCMonth(),
    from.getUTCDate(),
  );
  const sunday = base - new Date(base).getUTCDay() * ONE_DAY_MS;

  const dates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(sunday + index * ONE_DAY_MS);
    return {
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
    };
  });

  return { dates: dates, start: new Date(sunday) };
}

/**
 * Proyecta una franja semanal sobre la semana de referencia.
 *
 * @param week - Semana sobre la que aterrizar.
 * @param weekday - Día de la regla, 0 = domingo.
 * @param start - Hora de pared de comienzo.
 * @param end - Hora de pared de fin.
 * @param zone - Zona de la sede donde esa hora de pared se lee.
 */
export function intervalInWeek(
  week: ReferenceWeek,
  weekday: number,
  start: string,
  end: string,
  zone: string,
): { from: number; to: number } {
  const date = week.dates[((weekday % 7) + 7) % 7];
  return {
    from: localTimeToUtc(date, start, zone).getTime(),
    to: localTimeToUtc(date, end, zone).getTime(),
  };
}

/**
 * Si dos franjas comparten algún instante.
 *
 * Los extremos no cuentan: terminar a las 12:00 en una sede y empezar a las
 * 12:00 en otra no es estar en dos lados a la vez.
 */
export function overlap(
  a: { from: number; to: number },
  b: { from: number; to: number },
): boolean {
  return a.from < b.to && b.from < a.to;
}

/** Los minutos desde medianoche de un `HH:MM` o `HH:MM:SS`. */
/** Lo mínimo de una franja que el redondeo necesita mirar. */
export interface DayBand {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

/**
 * Dónde empieza la franja que sigue a ésta el mismo día, o `null` si es la
 * última. Es el tope del redondeo hacia adelante: el último turno se completa
 * pasando la hora de fin, pero no puede pisar la franja de la tarde.
 */
export function nextBandStart(
  band: DayBand,
  bands: readonly DayBand[],
): string | null {
  const later = bands
    .filter(
      (other) =>
        other.dayOfWeek === band.dayOfWeek && other.startTime >= band.endTime,
    )
    .map((other) => other.startTime)
    .sort();
  return later[0] ?? null;
}

export function minutesOfDay(hhmm: string): number {
  const [h, m] = hhmm.split(':');
  return Number(h) * 60 + Number(m ?? 0);
}

/** Cómo se nombra una franja cuando hay que decir con cuál choca. */
export function bandLabel(rule: {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}): string {
  const day = DAY_NAME[((rule.dayOfWeek % 7) + 7) % 7] ?? '?';
  return `${day} ${rule.startTime}–${rule.endTime}`;
}

/**
 * Si la plantilla dejó de estar vigente antes de la semana que se evalúa.
 *
 * Una plantilla vencida no puede chocar con nada que se publique hoy, y
 * hacerla chocar dejaría trabado a quien cambió de sede el mes pasado.
 */
export function isExpired(validTo: Date | undefined, weekStart: Date): boolean {
  return validTo !== undefined && validTo !== null
    ? validTo.getTime() < weekStart.getTime()
    : false;
}
