import type { InactivityAssessment } from './support-lifecycle';
import type { PrivilegeCreepResult } from './support-privilege-score';
import type { PermissionSensitivity } from './support-permission-catalog';
import {
  isWithinWindows,
  startOfZonedDay,
  type TimeWindow,
} from './support-time';

/**
 * Reglas de anomalías de actividad (CONTRATO-GOBIERNO §6.6), deterministas y
 * sin aprendizaje automático. Son funciones puras sobre series ya agregadas por
 * el barrido (`grant_usage_stats`, `access_decision_log`); la evidencia que
 * devuelven son números y textos cortos: nunca identificadores de pacientes ni
 * texto libre (cero PHI). Una anomalía no corta el acceso por sí sola.
 */

/** Tipos de anomalía (`delegated_access:ANOMALY_*`). */
export const ANOMALY_KINDS = [
  'ANOMALY_SEARCH_SPIKE',
  'ANOMALY_CANCEL_SPIKE',
  'ANOMALY_OFF_HOURS',
  'ANOMALY_DENIED_BURST',
  'ANOMALY_BROWSE_PATIENTS',
  'ANOMALY_INACTIVE_ACCOUNT',
  'ANOMALY_PRIVILEGE_CREEP',
] as const;
export type AnomalyKind = (typeof ANOMALY_KINDS)[number];

/** Umbrales por defecto del contrato. */
export const ANOMALY_DEFAULTS = {
  /** Línea base de 28 días. */
  baselineDays: 28,
  searchSpike: { minThreshold: 15, multiplier: 3, windowMinutes: 60 },
  cancelSpike: { minThreshold: 10, multiplier: 3 },
  offHours: { minActions: 5, defaultFrom: '07:00', defaultTo: '20:00' },
  deniedBurst: { minDecisions: 10, windowMinutes: 10 },
  browsePatients: { maxDistinctPatients: 40 },
} as const;

/** Valor de la evidencia: número, texto o lista de textos. */
export type AnomalyEvidenceValue =
  number | string | boolean | readonly string[];

/** Una anomalía hallada. */
export interface AnomalyFinding {
  readonly kind: AnomalyKind;
  readonly windowStart: Date;
  readonly windowEnd: Date;
  /** Lo observado. */
  readonly observed: number;
  /** Línea base de la persona; `null` si no hay. */
  readonly baseline: number | null;
  /** Umbral que se superó. */
  readonly threshold: number;
  /** Datos para quien revisa (sin PHI). */
  readonly evidence: Readonly<Record<string, AnomalyEvidenceValue>>;
}

/** Ventana evaluada `[windowStart, windowEnd)`. */
export interface AnomalyWindow {
  readonly windowStart: Date;
  readonly windowEnd: Date;
}

/**
 * Percentil por rango más cercano: el valor en la posición `⌈p/100 · n⌉` de la
 * lista ordenada. Vacío = 0; `p = 0` da el mínimo.
 */
export function percentile(values: readonly number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.min(
    sorted.length,
    Math.max(1, Math.ceil((p / 100) * sorted.length)),
  );
  return sorted[rank - 1];
}

/** Promedio; vacío = 0. */
export function mean(values: readonly number[]): number {
  return values.length === 0
    ? 0
    : values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * `patients.search.exact`: `PERMIT` en la ventana (60 min) por encima de
 * `max(15, 3 × p95 horario de la persona en 28 días)`.
 *
 * @param input.permitsInWindow - Búsquedas permitidas en la ventana.
 * @param input.hourlyBaseline - Conteo por hora de los últimos 28 días (con las horas sin actividad en cero).
 */
export function detectSearchSpike(
  input: AnomalyWindow & {
    readonly permitsInWindow: number;
    readonly hourlyBaseline: readonly number[];
  },
): AnomalyFinding | undefined {
  const cfg = ANOMALY_DEFAULTS.searchSpike;
  const p95 = percentile(input.hourlyBaseline, 95);
  const threshold = Math.max(cfg.minThreshold, cfg.multiplier * p95);
  if (input.permitsInWindow <= threshold) return undefined;
  return {
    kind: 'ANOMALY_SEARCH_SPIKE',
    windowStart: input.windowStart,
    windowEnd: input.windowEnd,
    observed: input.permitsInWindow,
    baseline: input.hourlyBaseline.length > 0 ? p95 : null,
    threshold,
    evidence: {
      permitsInWindow: input.permitsInWindow,
      p95Hourly: p95,
      baselineHours: input.hourlyBaseline.length,
      atom: 'patients.search.exact',
    },
  };
}

/**
 * `agenda.appointment.cancel`: cancelaciones del día por encima de
 * `max(10, 3 × promedio diario de 28 días)`.
 */
export function detectCancelSpike(
  input: AnomalyWindow & {
    readonly cancelsInWindow: number;
    readonly dailyBaseline: readonly number[];
  },
): AnomalyFinding | undefined {
  const cfg = ANOMALY_DEFAULTS.cancelSpike;
  const avg = mean(input.dailyBaseline);
  const threshold = Math.max(cfg.minThreshold, cfg.multiplier * avg);
  if (input.cancelsInWindow <= threshold) return undefined;
  return {
    kind: 'ANOMALY_CANCEL_SPIKE',
    windowStart: input.windowStart,
    windowEnd: input.windowEnd,
    observed: input.cancelsInWindow,
    baseline: input.dailyBaseline.length > 0 ? avg : null,
    threshold,
    evidence: {
      cancelsInWindow: input.cancelsInWindow,
      dailyAverage: avg,
      baselineDays: input.dailyBaseline.length,
      atom: 'agenda.appointment.cancel',
    },
  };
}

const SENSITIVITY_RANK: Readonly<Record<PermissionSensitivity, number>> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

const DEFAULT_OFF_HOURS_WINDOWS: readonly TimeWindow[] = [
  {
    days: [0, 1, 2, 3, 4, 5, 6],
    from: ANOMALY_DEFAULTS.offHours.defaultFrom,
    to: ANOMALY_DEFAULTS.offHours.defaultTo,
  },
];

/**
 * Fuera de horario: al menos 5 acciones de sensibilidad ≥ MEDIA, dentro del día
 * evaluado, fuera de las ventanas `time` de la persona o, si no tiene, fuera de
 * 07:00-20:00 en la zona de la organización. Lo que no se puede ubicar (zona
 * inválida) cuenta como fuera: el aviso falla hacia el lado visible.
 */
export function detectOffHours(
  input: AnomalyWindow & {
    readonly events: ReadonlyArray<{
      readonly at: Date;
      readonly sensitivity: PermissionSensitivity;
    }>;
    /** Ventanas `time` de la persona; ausentes o vacías = 07:00-20:00. */
    readonly windows?: readonly TimeWindow[];
    readonly timeZone: string;
  },
): AnomalyFinding | undefined {
  const windows =
    input.windows && input.windows.length > 0
      ? input.windows
      : DEFAULT_OFF_HOURS_WINDOWS;
  const from = input.windowStart.getTime();
  const to = input.windowEnd.getTime();
  const count = input.events.filter(
    (e) =>
      e.at.getTime() >= from &&
      e.at.getTime() < to &&
      SENSITIVITY_RANK[e.sensitivity] >= SENSITIVITY_RANK.MEDIUM &&
      !isWithinWindows(windows, e.at, input.timeZone),
  ).length;
  const threshold = ANOMALY_DEFAULTS.offHours.minActions;
  if (count < threshold) return undefined;
  return {
    kind: 'ANOMALY_OFF_HOURS',
    windowStart: input.windowStart,
    windowEnd: input.windowEnd,
    observed: count,
    baseline: null,
    threshold,
    evidence: {
      actionsOutsideWindows: count,
      usedOwnWindows: !!input.windows && input.windows.length > 0,
    },
  };
}

/**
 * Ráfaga de denegaciones: al menos 10 decisiones `DENY` o `CHALLENGE` de la
 * misma persona en 10 minutos (sondeo de permisos). La ventana es la primera que
 * llega al mínimo y arranca en su primera decisión (estable aunque lleguen más).
 *
 * @param input.decisions - Instantes de las decisiones `DENY`/`CHALLENGE` de UNA persona.
 */
export function detectDeniedBurst(input: {
  readonly decisions: readonly Date[];
  readonly minDecisions?: number;
  readonly windowMinutes?: number;
}): AnomalyFinding | undefined {
  const min = input.minDecisions ?? ANOMALY_DEFAULTS.deniedBurst.minDecisions;
  const span =
    (input.windowMinutes ?? ANOMALY_DEFAULTS.deniedBurst.windowMinutes) *
    60_000;
  const t = input.decisions.map((d) => d.getTime()).sort((a, b) => a - b);
  let firstStart: number | undefined;
  let max = 0;
  let j = 0;
  for (let i = 0; i < t.length; i += 1) {
    if (j < i) j = i;
    while (j < t.length && t[j] < t[i] + span) j += 1;
    const count = j - i;
    if (count > max) max = count;
    if (firstStart === undefined && count >= min) firstStart = t[i];
  }
  if (firstStart === undefined) return undefined;
  return {
    kind: 'ANOMALY_DENIED_BURST',
    windowStart: new Date(firstStart),
    windowEnd: new Date(firstStart + span),
    observed: max,
    baseline: null,
    threshold: min,
    evidence: { decisionsInWindow: max, windowMinutes: span / 60_000 },
  };
}

/**
 * Navegar pacientes: más de 40 pacientes distintos vistos en un día SIN cita en
 * la organización. Un paciente visto con y sin cita cuenta como con cita. La
 * evidencia es solo el conteo.
 */
export function detectBrowsePatients(
  input: AnomalyWindow & {
    readonly views: ReadonlyArray<{
      readonly patientId: string;
      readonly hasAppointment: boolean;
    }>;
  },
): AnomalyFinding | undefined {
  const withAppointment = new Set<string>();
  const all = new Set<string>();
  for (const v of input.views) {
    all.add(v.patientId);
    if (v.hasAppointment) withAppointment.add(v.patientId);
  }
  const without = [...all].filter((id) => !withAppointment.has(id)).length;
  const threshold = ANOMALY_DEFAULTS.browsePatients.maxDistinctPatients;
  if (without <= threshold) return undefined;
  return {
    kind: 'ANOMALY_BROWSE_PATIENTS',
    windowStart: input.windowStart,
    windowEnd: input.windowEnd,
    observed: without,
    baseline: null,
    threshold,
    evidence: { distinctPatientsWithoutAppointment: without },
  };
}

/** Cuenta inactiva (§6.1): días sin actividad ≥ `inactivityDays`. */
export function detectInactiveAccount(
  input: AnomalyWindow & {
    readonly assessment: InactivityAssessment;
    readonly inactivityDays: number;
  },
): AnomalyFinding | undefined {
  if (!input.assessment.inactive) return undefined;
  return {
    kind: 'ANOMALY_INACTIVE_ACCOUNT',
    windowStart: input.windowStart,
    windowEnd: input.windowEnd,
    observed: input.assessment.daysInactive,
    baseline: null,
    threshold: input.inactivityDays,
    evidence: {
      daysInactive: input.assessment.daysInactive,
      autoSuspend: input.assessment.autoSuspend,
    },
  };
}

/** Acumulación de privilegios (§6.6): deriva ≥ umbral o concesiones sin revisar. */
export function detectPrivilegeCreep(
  input: AnomalyWindow & { readonly creep: PrivilegeCreepResult },
): AnomalyFinding | undefined {
  const c = input.creep;
  if (!c.flagged) return undefined;
  return {
    kind: 'ANOMALY_PRIVILEGE_CREEP',
    windowStart: input.windowStart,
    windowEnd: input.windowEnd,
    observed: c.drift ?? c.score,
    baseline: c.baseline,
    threshold: c.threshold,
    evidence: {
      score: c.score,
      reasons: c.reasons,
      grantsSinceCertification: c.grantsSinceCertification,
    },
  };
}

const HOUR_KINDS: ReadonlySet<AnomalyKind> = new Set([
  'ANOMALY_SEARCH_SPIKE',
  'ANOMALY_DENIED_BURST',
]);

/**
 * Ventana de evaluación del barrido, estable para que sea idempotente por
 * `(tenant, usuario, tipo, window_start)`: las reglas por hora miran la última
 * hora completa; las demás, el día de la organización que contiene `now`.
 *
 * @param kind - Tipo de anomalía.
 * @param now - Instante del barrido.
 * @param timeZone - Zona de la organización.
 */
export function anomalyWindow(
  kind: AnomalyKind,
  now: Date,
  timeZone: string,
): { readonly windowStart: Date; readonly windowEnd: Date } {
  if (HOUR_KINDS.has(kind)) {
    const hour = 3_600_000;
    const end = Math.floor(now.getTime() / hour) * hour;
    return { windowStart: new Date(end - hour), windowEnd: new Date(end) };
  }
  const start = startOfZonedDay(now, timeZone, 0);
  const end = startOfZonedDay(now, timeZone, 1);
  if (start && end) return { windowStart: start, windowEnd: end };
  // Zona inválida: día UTC, para que el barrido siga siendo determinista.
  const utc = Math.floor(now.getTime() / 86_400_000) * 86_400_000;
  return { windowStart: new Date(utc), windowEnd: new Date(utc + 86_400_000) };
}
