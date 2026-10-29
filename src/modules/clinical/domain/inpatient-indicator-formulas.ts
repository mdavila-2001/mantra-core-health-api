import type { CensusCounts } from './census-calculation';

/** Una cama liberada y lo que tardó en volver a estar disponible. */
export interface TurnaroundSample {
  /** Hora del egreso. */
  readonly dischargedAt: Date;
  /** Cuando se pidió la limpieza. */
  readonly requestedAt: Date;
  /** Cuando empezó. */
  readonly startedAt: Date | null;
  /** Cuando terminó. */
  readonly finishedAt: Date | null;
  /** Cuando se inspeccionó. */
  readonly inspectedAt: Date | null;
}

/** Indicadores de cama de la línea OPS (`procesos/12`). */
export interface InpatientIndicators {
  /** Días del período (ambos extremos incluidos). */
  readonly days: number;
  /** Σ camas disponibles. */
  readonly bedDaysAvailable: number;
  /** Σ días-paciente. */
  readonly patientDays: number;
  /** Σ ingresos. */
  readonly admissions: number;
  /** Σ egresos. */
  readonly discharges: number;
  /** Σ días de estancia de los egresos. */
  readonly dischargeStayDays: number;
  /** Camas promedio: Σ disponibles ÷ días. */
  readonly avgBeds: number | null;
  /** Días-paciente ÷ días-cama × 100. */
  readonly occupancyPct: number | null;
  /** Σ días de estancia ÷ egresos. */
  readonly alos: number | null;
  /** Egresos ÷ camas promedio. */
  readonly bedTurnover: number | null;
  /** (días-cama − días-paciente) ÷ egresos. */
  readonly turnoverInterval: number | null;
  /** Rotación de cama en minutos. */
  readonly bedTurnaroundMinutes: {
    readonly samples: number;
    readonly p50: number | null;
    readonly p90: number | null;
    readonly waitToStart: number | null;
    readonly cleaning: number | null;
    readonly inspection: number | null;
  };
  /** Prueba cruzada. */
  readonly crossCheck: {
    readonly occupancyFromAlos: number | null;
    readonly deltaPct: number | null;
  };
}

/** Redondea a 2 decimales (los indicadores se informan así). */
export const round2 = (value: number): number => Math.round(value * 100) / 100;

const ratio = (num: number, den: number): number | null =>
  den > 0 ? num / den : null;

/**
 * Percentil por interpolación lineal (equivale a `percentile_cont`).
 *
 * @param sorted - Valores ordenados de menor a mayor.
 * @param p - Fracción entre 0 y 1.
 */
export function percentile(sorted: readonly number[], p: number): number | null {
  if (sorted.length === 0) return null;
  const rank = (sorted.length - 1) * p;
  const low = Math.floor(rank);
  const high = Math.ceil(rank);
  return sorted[low] + (sorted[high] - sorted[low]) * (rank - low);
}

const minutes = (from: Date, to: Date): number =>
  (to.getTime() - from.getTime()) / 60_000;

const mean = (values: readonly number[]): number | null =>
  values.length === 0
    ? null
    : values.reduce((sum, value) => sum + value, 0) / values.length;

/**
 * Rotación de cama: de la hora del egreso a la hora en que la cama vuelve a
 * estar disponible (inspección si la hubo; si no, el fin de la limpieza).
 * Sólo cuentan las órdenes ya cerradas.
 *
 * @param samples - Egresos con la orden de limpieza que los siguió.
 */
export function turnaround(
  samples: readonly TurnaroundSample[],
): InpatientIndicators['bedTurnaroundMinutes'] {
  const totals: number[] = [];
  const waits: number[] = [];
  const cleanings: number[] = [];
  const inspections: number[] = [];
  for (const sample of samples) {
    const availableAt = sample.inspectedAt ?? sample.finishedAt;
    if (!availableAt) continue;
    totals.push(minutes(sample.dischargedAt, availableAt));
    if (sample.startedAt) {
      waits.push(minutes(sample.dischargedAt, sample.startedAt));
      if (sample.finishedAt)
        cleanings.push(minutes(sample.startedAt, sample.finishedAt));
    }
    if (sample.inspectedAt && sample.finishedAt)
      inspections.push(minutes(sample.finishedAt, sample.inspectedAt));
  }
  totals.sort((a, b) => a - b);
  const orNull = (value: number | null): number | null =>
    value === null ? null : round2(value);
  return {
    samples: totals.length,
    p50: orNull(percentile(totals, 0.5)),
    p90: orNull(percentile(totals, 0.9)),
    waitToStart: orNull(mean(waits)),
    cleaning: orNull(mean(cleanings)),
    inspection: orNull(mean(inspections)),
  };
}

/**
 * Indicadores del período a partir de los días **cerrados** (con sus ajustes ya
 * aplicados). Las fórmulas son las de `procesos/12`:
 *
 * - % ocupación = DP ÷ DCD × 100
 * - ALOS = Σ días de estancia ÷ egresos
 * - Giro = egresos ÷ camas promedio, con camas promedio = DCD ÷ días del período
 * - Intervalo de sustitución = (DCD − DP) ÷ egresos
 * - Prueba cruzada: % ocupación ≈ ALOS × giro ÷ días × 100. `deltaPct` es la
 *   diferencia **relativa** entre las dos ocupaciones, en %.
 *
 * @param closedDays - Totales (ya ajustados) de cada día cerrado del período.
 * @param periodDays - Días del período (los faltantes no se inventan: bajan las camas promedio).
 * @param samples - Rotaciones de cama del período.
 */
export function computeIndicators(
  closedDays: readonly CensusCounts[],
  periodDays: number,
  samples: readonly TurnaroundSample[],
): InpatientIndicators {
  const sum = (field: keyof CensusCounts): number =>
    closedDays.reduce((total, day) => total + day[field], 0);
  const bedDaysAvailable = sum('beds_available');
  const patientDays = sum('patient_days');
  const admissions = sum('admissions');
  const discharges = sum('discharges');
  const dischargeStayDays = sum('discharge_stay_days');

  const avgBeds = ratio(bedDaysAvailable, periodDays);
  const occupancy = ratio(patientDays, bedDaysAvailable);
  const alos = ratio(dischargeStayDays, discharges);
  const turnover =
    avgBeds !== null && avgBeds > 0 ? discharges / avgBeds : null;
  const interval = ratio(bedDaysAvailable - patientDays, discharges);

  const occupancyPct = occupancy === null ? null : occupancy * 100;
  const occupancyFromAlos =
    alos !== null && turnover !== null && periodDays > 0
      ? ((alos * turnover) / periodDays) * 100
      : null;
  const deltaPct =
    occupancyPct !== null && occupancyFromAlos !== null && occupancyPct > 0
      ? (Math.abs(occupancyFromAlos - occupancyPct) / occupancyPct) * 100
      : null;
  const orNull = (value: number | null): number | null =>
    value === null ? null : round2(value);

  return {
    days: periodDays,
    bedDaysAvailable,
    patientDays,
    admissions,
    discharges,
    dischargeStayDays,
    avgBeds: orNull(avgBeds),
    occupancyPct: orNull(occupancyPct),
    alos: orNull(alos),
    bedTurnover: orNull(turnover),
    turnoverInterval: orNull(interval),
    bedTurnaroundMinutes: turnaround(samples),
    crossCheck: {
      occupancyFromAlos: orNull(occupancyFromAlos),
      deltaPct: orNull(deltaPct),
    },
  };
}
