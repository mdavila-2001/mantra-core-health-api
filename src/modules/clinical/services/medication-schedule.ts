import { DateTime, IANAZone } from 'luxon';

/* ============================================================================
    Cronograma de tomas de una receta (patch v4.2.35)

    Funciones puras, sin Nest ni ORM: reciben la posología estructurada y
    devuelven instantes. Las usan el despacho de recordatorios
    (`medication-reminders.service.ts`) y la exportación a iCalendar
    (`medication-schedule-ics.ts`), así que las dos caras calculan las mismas
    tomas.

    ## Qué subconjunto de FHIR `Timing.repeat` se admite

    - `asNeeded` (PRN): no hay tomas programadas.
    - `frequency` veces cada `period` `periodUnit` (h, d, wk): tomas
      equiespaciadas desde el ancla. «3 veces por día» = cada 8 h.
    - `timesOfDay` («08:00», «20:00»): todos los días a esas horas locales.
      Excluyente con `frequency/period` (decisión D1 del PLAN): FHIR admite
      combinarlos, pero para un recordatorio el significado queda ambiguo.
    - `durationDays`: duración desde el ancla; 0 = sin tomas.
    - `timeZone`: zona IANA de las horas del día; por defecto La Paz.
   ========================================================================== */

/** Zona por defecto del negocio: Bolivia, −04:00 todo el año. */
export const DEFAULT_MEDICATION_TIME_ZONE = 'America/La_Paz';

/** Unidades de período admitidas. */
export const MEDICATION_PERIOD_UNITS = ['h', 'd', 'wk'] as const;

/** Unidad de período de la posología. */
export type MedicationPeriodUnit = (typeof MEDICATION_PERIOD_UNITS)[number];

/** Minutos por unidad de período. */
const MINUTES_PER_UNIT: Readonly<Record<MedicationPeriodUnit, number>> = {
  h: 60,
  d: 60 * 24,
  wk: 60 * 24 * 7,
};

/** `HH:mm` de 00:00 a 23:59. */
export const TIME_OF_DAY_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Posología estructurada, tal como vive en la receta. */
export interface MedicationTiming {
  /** PRN / «según necesidad». */
  readonly asNeeded: boolean;
  /** Tomas por período. */
  readonly frequency?: number;
  /** Longitud del período. */
  readonly period?: number;
  /** Unidad del período. */
  readonly periodUnit?: MedicationPeriodUnit;
  /** Horas locales del día, `HH:mm`. */
  readonly timesOfDay?: readonly string[];
  /** Ancla de la primera toma. */
  readonly startAt?: Date;
  /** Duración en días desde el ancla; 0 = sin tomas. */
  readonly durationDays?: number;
  /** Zona IANA de las horas del día. */
  readonly timeZone?: string;
}

/** Datos de la receta que acotan el cronograma. */
export interface MedicationScheduleContext {
  /** Inicio de vigencia; ancla si la posología no declara `startAt`. */
  readonly validFrom?: Date;
  /** Fin de vigencia: ninguna toma después de este instante. */
  readonly validTo?: Date;
  /** Emisión; último recurso como ancla. */
  readonly issuedAt?: Date;
}

/** Por qué una posología no produce tomas. */
export type EmptyScheduleReason =
  'AS_NEEDED' | 'ZERO_DURATION' | 'NO_TIMING' | 'NO_START';

/** Hora local del día. */
export interface LocalTime {
  /** 0..23. */
  readonly hour: number;
  /** 0..59. */
  readonly minute: number;
}

/** El cronograma ya resuelto: qué forma tiene y entre qué instantes vale. */
export type ResolvedMedicationSchedule =
  | {
      readonly kind: 'EMPTY';
      readonly reason: EmptyScheduleReason;
    }
  | {
      readonly kind: 'TIMES_OF_DAY';
      readonly timeZone: string;
      /** Primer instante en que puede haber una toma. */
      readonly start: Date;
      /** Ninguna toma en o después de este instante. */
      readonly endExclusive?: Date;
      /** Horas del día, ordenadas y sin repetir. */
      readonly times: readonly LocalTime[];
    }
  | {
      readonly kind: 'INTERVAL';
      readonly timeZone: string;
      /** Primera toma. */
      readonly start: Date;
      /** Ninguna toma en o después de este instante. */
      readonly endExclusive?: Date;
      /** Minutos entre tomas; puede no ser entero (p. ej. 7 veces por día). */
      readonly intervalMinutes: number;
    };

/** La posología es incoherente: el DTO la tendría que haber rechazado antes. */
export class InvalidMedicationTimingError extends Error {
  /**
   * @param code - Motivo estable, para tests y logs.
   * @param message - Explicación en castellano.
   */
  constructor(
    readonly code:
      | 'AS_NEEDED_WITH_SCHEDULE'
      | 'FREQUENCY_WITHOUT_PERIOD'
      | 'INVALID_FREQUENCY'
      | 'INVALID_PERIOD'
      | 'INVALID_PERIOD_UNIT'
      | 'INVALID_TIME_OF_DAY'
      | 'EXCLUSIVE_SCHEDULE'
      | 'INVALID_DURATION'
      | 'INVALID_TIME_ZONE',
    message: string,
  ) {
    super(message);
    this.name = 'InvalidMedicationTimingError';
  }
}

/** `true` si la zona existe en la base IANA que trae el runtime. */
export function isValidTimeZone(zone: string): boolean {
  return IANAZone.isValidZone(zone);
}

/**
 * Convierte `HH:mm` a hora local.
 *
 * @throws InvalidMedicationTimingError si no es una hora válida.
 */
export function parseTimeOfDay(value: string): LocalTime {
  const match = TIME_OF_DAY_PATTERN.exec(value);
  if (!match) {
    throw new InvalidMedicationTimingError(
      'INVALID_TIME_OF_DAY',
      `«${value}» no es una hora del día válida (HH:mm, 00:00 a 23:59)`,
    );
  }
  return { hour: Number(match[1]), minute: Number(match[2]) };
}

/**
 * Valida la posología y la reduce a una de tres formas.
 *
 * @param timing - Posología estructurada de la receta.
 * @param context - Vigencia y emisión de la receta.
 * @returns El cronograma resuelto, o `EMPTY` con su motivo.
 * @throws InvalidMedicationTimingError si la posología es incoherente.
 */
export function resolveMedicationSchedule(
  timing: MedicationTiming,
  context: MedicationScheduleContext = {},
): ResolvedMedicationSchedule {
  const timeZone = timing.timeZone ?? DEFAULT_MEDICATION_TIME_ZONE;
  if (!isValidTimeZone(timeZone)) {
    throw new InvalidMedicationTimingError(
      'INVALID_TIME_ZONE',
      `«${timeZone}» no es una zona horaria IANA conocida`,
    );
  }

  const hasInterval =
    timing.frequency !== undefined ||
    timing.period !== undefined ||
    timing.periodUnit !== undefined;
  const hasTimes =
    timing.timesOfDay !== undefined && timing.timesOfDay.length > 0;

  if (timing.asNeeded) {
    if (hasInterval || hasTimes) {
      throw new InvalidMedicationTimingError(
        'AS_NEEDED_WITH_SCHEDULE',
        'Una toma «según necesidad» no lleva frecuencia ni horas fijas',
      );
    }
    return { kind: 'EMPTY', reason: 'AS_NEEDED' };
  }
  if (hasInterval && hasTimes) {
    throw new InvalidMedicationTimingError(
      'EXCLUSIVE_SCHEDULE',
      'Las horas del día y la frecuencia por período son excluyentes',
    );
  }
  if (
    timing.durationDays !== undefined &&
    (!Number.isInteger(timing.durationDays) || timing.durationDays < 0)
  ) {
    throw new InvalidMedicationTimingError(
      'INVALID_DURATION',
      'La duración es un número entero de días, 0 o mayor',
    );
  }

  let intervalMinutes: number | undefined;
  let times: LocalTime[] | undefined;
  if (hasInterval) {
    intervalMinutes = intervalMinutesOf(timing);
  } else if (hasTimes) {
    times = normalizeTimes(timing.timesOfDay ?? []);
  } else {
    return { kind: 'EMPTY', reason: 'NO_TIMING' };
  }

  if (timing.durationDays === 0) {
    return { kind: 'EMPTY', reason: 'ZERO_DURATION' };
  }

  const start = timing.startAt ?? context.validFrom ?? context.issuedAt;
  if (!start) return { kind: 'EMPTY', reason: 'NO_START' };

  const endExclusive = earliest(
    timing.durationDays !== undefined
      ? DateTime.fromJSDate(start, { zone: timeZone })
          .plus({ days: timing.durationDays })
          .toJSDate()
      : undefined,
    // `validTo` es inclusivo: una toma justo en ese instante todavía vale.
    context.validTo ? new Date(context.validTo.getTime() + 1) : undefined,
  );
  if (endExclusive && endExclusive.getTime() <= start.getTime()) {
    return { kind: 'EMPTY', reason: 'ZERO_DURATION' };
  }

  if (intervalMinutes !== undefined) {
    return { kind: 'INTERVAL', timeZone, start, endExclusive, intervalMinutes };
  }
  return {
    kind: 'TIMES_OF_DAY',
    timeZone,
    start,
    endExclusive,
    times: times ?? [],
  };
}

/**
 * Tomas del cronograma en `[from, to)`, ordenadas.
 *
 * @param schedule - Cronograma resuelto.
 * @param from - Inicio de la ventana, inclusivo.
 * @param to - Fin de la ventana, exclusivo.
 * @param max - Tope de tomas devueltas.
 * @returns Los instantes de toma dentro de la ventana.
 */
export function medicationDosesBetween(
  schedule: ResolvedMedicationSchedule,
  from: Date,
  to: Date,
  max = 500,
): Date[] {
  if (schedule.kind === 'EMPTY') return [];
  const lower = Math.max(from.getTime(), schedule.start.getTime());
  const upper = Math.min(
    to.getTime(),
    schedule.endExclusive?.getTime() ?? Number.POSITIVE_INFINITY,
  );
  if (upper <= lower) return [];

  const doses: Date[] = [];
  if (schedule.kind === 'INTERVAL') {
    const stepMs = schedule.intervalMinutes * 60_000;
    const startMs = schedule.start.getTime();
    let k = Math.max(0, Math.ceil((lower - startMs) / stepMs));
    for (; doses.length < max; k++) {
      // Redondeo al milisegundo: un intervalo fraccionario no debe acumular
      // deriva de coma flotante entre la toma 1 y la 100.
      const at = Math.round(startMs + k * stepMs);
      if (at >= upper) break;
      if (at >= lower) doses.push(new Date(at));
    }
    return doses;
  }

  // Horas del día: se recorre día local por día local, en la zona del paciente.
  let day = DateTime.fromMillis(lower, { zone: schedule.timeZone }).startOf(
    'day',
  );
  while (doses.length < max && day.toMillis() < upper) {
    for (const time of schedule.times) {
      const at = day.set({ hour: time.hour, minute: time.minute }).toMillis();
      if (at >= lower && at < upper) {
        doses.push(new Date(at));
        if (doses.length >= max) break;
      }
    }
    day = day.plus({ days: 1 });
  }
  return doses;
}

/** Minutos entre tomas de una posología por frecuencia. */
function intervalMinutesOf(timing: MedicationTiming): number {
  if (
    timing.frequency === undefined ||
    timing.period === undefined ||
    timing.periodUnit === undefined
  ) {
    throw new InvalidMedicationTimingError(
      'FREQUENCY_WITHOUT_PERIOD',
      'La frecuencia necesita período y unidad, y viceversa',
    );
  }
  if (!Number.isInteger(timing.frequency) || timing.frequency < 1) {
    throw new InvalidMedicationTimingError(
      'INVALID_FREQUENCY',
      'La frecuencia es un entero de 1 o más tomas por período',
    );
  }
  if (!Number.isFinite(timing.period) || timing.period <= 0) {
    throw new InvalidMedicationTimingError(
      'INVALID_PERIOD',
      'El período tiene que ser mayor que 0',
    );
  }
  if (
    !(MEDICATION_PERIOD_UNITS as readonly string[]).includes(timing.periodUnit)
  ) {
    throw new InvalidMedicationTimingError(
      'INVALID_PERIOD_UNIT',
      `Unidad de período «${String(timing.periodUnit)}» no admitida (h, d, wk)`,
    );
  }
  return (
    (timing.period * MINUTES_PER_UNIT[timing.periodUnit]) / timing.frequency
  );
}

/** Parsea, ordena y quita repetidas. */
function normalizeTimes(values: readonly string[]): LocalTime[] {
  const unique = new Map<number, LocalTime>();
  for (const value of values) {
    const time = parseTimeOfDay(value);
    unique.set(time.hour * 60 + time.minute, time);
  }
  return [...unique.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, time]) => time);
}

/** El más temprano de los instantes definidos. */
function earliest(...dates: (Date | undefined)[]): Date | undefined {
  const defined = dates.filter((date): date is Date => date !== undefined);
  if (defined.length === 0) return undefined;
  return new Date(Math.min(...defined.map((date) => date.getTime())));
}
