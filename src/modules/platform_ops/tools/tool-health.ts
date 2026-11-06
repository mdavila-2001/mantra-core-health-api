import type { ToolCheckType, ToolStatus } from './tool-catalog';

export type ToolHealthState = 'OK' | 'FAIL' | 'NOT_PROBED';

/** Resultado de una corrida de `health_check_runs`, ya traducido a texto. */
export type RunOutcome = 'PASS' | 'WARN' | 'FAIL' | 'TIMEOUT' | 'ERROR';

export interface LastRun {
  readonly outcome: RunOutcome;
  readonly recordedAt: Date;
}

export interface ToolHealth {
  state: ToolHealthState;
  checkType: ToolCheckType;
  observedAt: string | null;
  /** Solo NOMBRES de variables; nunca valores. */
  missingEnvVars: string[];
}

export interface ToolHealthInput {
  readonly status: ToolStatus;
  /** Tipo declarado en `health_checks`; `null` si la herramienta no tiene chequeo. */
  readonly checkType: ToolCheckType | null;
  readonly requiredEnvVars: readonly string[];
  readonly lastRun: LastRun | null;
  /** Ventana en la que una corrida LIVE todavía cuenta como «reciente». */
  readonly freshnessMs: number;
  readonly env: Readonly<Record<string, string | undefined>>;
  readonly now: Date;
}

export interface ToolHealthEvaluation {
  health: ToolHealth;
  /** Presente solo si `health.state === 'NOT_PROBED'`: por qué nadie lo midió. */
  notProbedReason: string | null;
}

/** Ventana por defecto si el chequeo no declara `interval_seconds`. */
export const DEFAULT_LIVE_FRESHNESS_MS = 5 * 60 * 1000;

/** Una corrida LIVE vale `FRESHNESS_FACTOR` intervalos del chequeo. */
export const FRESHNESS_FACTOR = 3;

/** Ventana de frescura de un chequeo según su intervalo declarado. */
export function liveFreshnessMs(
  intervalSeconds: number | null | undefined,
): number {
  return intervalSeconds && intervalSeconds > 0
    ? intervalSeconds * FRESHNESS_FACTOR * 1000
    : DEFAULT_LIVE_FRESHNESS_MS;
}

/** Una variable «existe» si está definida y no es una cadena vacía. */
function isPresent(value: string | undefined): boolean {
  return value !== undefined && value.trim() !== '';
}

/**
 * Evalúa la salud de una herramienta. Reglas, en orden:
 *
 *  1. Sin chequeo registrado, o tipo `NOT_APPLICABLE`, o estado de catálogo
 *     distinto de `ACTIVE`: `NOT_PROBED`. Nunca `OK` por defecto.
 *  2. `CONFIGURATION`: solo comprueba que las variables requeridas existen.
 *     Sin variables declaradas no hay nada que comprobar → `NOT_PROBED`.
 *     Con alguna ausente → `FAIL` y se devuelven sus NOMBRES. Todas presentes
 *     → `OK` observado en este instante (`now`).
 *  3. `LIVE`: solo cuenta una corrida real y reciente (`recordedAt` dentro de
 *     `freshnessMs`). Sin corridas o con la última vencida → `NOT_PROBED`
 *     (si hubo una vencida se conserva su fecha en `observedAt`).
 *     `PASS`/`WARN` → `OK`; `FAIL`/`TIMEOUT`/`ERROR` → `FAIL`.
 */
export function evaluateToolHealth(
  input: ToolHealthInput,
): ToolHealthEvaluation {
  const { status, checkType, requiredEnvVars, lastRun, env, now } = input;
  const notProbed = (
    type: ToolCheckType,
    reason: string,
    observedAt: Date | null = null,
  ): ToolHealthEvaluation => ({
    health: {
      state: 'NOT_PROBED',
      checkType: type,
      observedAt: observedAt ? observedAt.toISOString() : null,
      missingEnvVars: [],
    },
    notProbedReason: reason,
  });

  if (checkType === null) {
    return notProbed(
      'NOT_APPLICABLE',
      'Sin health check registrado para esta herramienta',
    );
  }
  if (status !== 'ACTIVE') {
    return notProbed(
      'NOT_APPLICABLE',
      `Herramienta ${status}: no hay integración activa que medir`,
    );
  }
  if (checkType === 'NOT_APPLICABLE') {
    return notProbed(
      'NOT_APPLICABLE',
      'Sin sonda ni variables obligatorias que verificar',
    );
  }

  if (checkType === 'CONFIGURATION') {
    if (requiredEnvVars.length === 0) {
      return notProbed(
        'CONFIGURATION',
        'Sin variables requeridas declaradas: no hay nada que verificar',
      );
    }
    const missing = requiredEnvVars.filter((name) => !isPresent(env[name]));
    return {
      health: {
        state: missing.length === 0 ? 'OK' : 'FAIL',
        checkType: 'CONFIGURATION',
        observedAt: now.toISOString(),
        missingEnvVars: missing,
      },
      notProbedReason: null,
    };
  }

  // LIVE
  if (lastRun === null) {
    return notProbed('LIVE', 'Sin corridas registradas en health_check_runs');
  }
  const ageMs = now.getTime() - lastRun.recordedAt.getTime();
  if (ageMs > input.freshnessMs) {
    return notProbed(
      'LIVE',
      `Última comprobación vencida (hace ${Math.round(ageMs / 1000)} s; ventana de ${Math.round(input.freshnessMs / 1000)} s)`,
      lastRun.recordedAt,
    );
  }
  const failed =
    lastRun.outcome === 'FAIL' ||
    lastRun.outcome === 'TIMEOUT' ||
    lastRun.outcome === 'ERROR';
  return {
    health: {
      state: failed ? 'FAIL' : 'OK',
      checkType: 'LIVE',
      observedAt: lastRun.recordedAt.toISOString(),
      missingEnvVars: [],
    },
    notProbedReason: null,
  };
}
