import type { InstanceDefinition } from './instance-registry';

/**
 * Regla de decisión de la sonda de vida de instancias. Función pura, sin I/O:
 * recibe lo leído (latido crudo, resultado de sonda) y el reloj de la API, y
 * devuelve el estado con su causa. Mismo criterio que `readiness.ts`: no saber
 * no es estar bien, y «VIVA» sólo se emite con evidencia fresca.
 */

export const INSTANCE_LIVENESS_MODEL_VERSION = 'instance-liveness/v1';

export type InstanceState = 'VIVA' | 'DEGRADADA' | 'CAIDA' | 'SIN_DATO';
export type OverallState = 'OK' | 'ATENCION' | 'CRITICO' | 'SIN_DATO';

export const LIVENESS_CAUSES = [
  'OK',
  'HEARTBEAT_LATE',
  'HEARTBEAT_EXPIRED',
  'NEVER_SEEN',
  'STORE_UNAVAILABLE',
  'CLOCK_INCONSISTENT',
  'RECORD_CORRUPT',
  'TICK_STUCK',
  'CIRCUIT_OPEN',
  'DRAINING',
  'PROBE_FAILED',
  'PROBE_TIMEOUT',
  'PROBE_SLOW',
  'NOT_PROBED',
] as const;
export type LivenessCause = (typeof LIVENESS_CAUSES)[number];

export type EvidenceSource = 'heartbeat' | 'probe' | 'self' | 'none';
export type ReportedStatus = 'starting' | 'running' | 'draining' | 'stopped';
const REPORTED_STATUSES: readonly string[] = [
  'starting',
  'running',
  'draining',
  'stopped',
];

/** Umbrales, todos en milisegundos; se comparan sin redondear. */
export interface LivenessThresholds {
  readonly workerHeartbeatIntervalMs: number;
  readonly degradedAfterMs: number;
  readonly downAfterMs: number;
  readonly dependencyLatencyDegradedMs: number;
  readonly dependencyProbeTimeoutMs: number;
  readonly clockToleranceMs: number;
}

/** Lo que la API guarda por latido. `receivedAt` es su propio reloj (epoch ms). */
export interface HeartbeatRecord {
  readonly receivedAt: number;
  readonly status: ReportedStatus;
  readonly startedAt: string | null;
  readonly liveness: { healthy: boolean };
  readonly readiness: { healthy: boolean };
}

/** Resultado de una sonda activa de dependencia (misma forma que `/readiness`). */
export interface ProbeOutcome {
  readonly status: 'up' | 'down';
  readonly latencyMs: number;
  /** Clase del error; nunca el mensaje. */
  readonly errorType?: string;
}

export interface InstanceEvidence {
  readonly source: EvidenceSource;
  readonly reportedStatus: ReportedStatus | null;
  readonly startedAt: string | null;
  readonly latencyMs: number | null;
}

export interface InstanceEvaluation {
  readonly id: string;
  readonly label: string;
  readonly type: InstanceDefinition['type'];
  readonly required: boolean;
  readonly state: InstanceState;
  readonly lastHeartbeatAt: string | null;
  readonly ageSeconds: number | null;
  readonly thresholdSeconds: number | null;
  readonly cause: LivenessCause;
  readonly causeDetail: string;
  readonly evidence: InstanceEvidence;
}

/** Lo leído antes de decidir; la decisión no hace I/O. */
export interface EvaluationContext {
  /** Reloj de la API en el momento de evaluar (epoch ms). */
  readonly now: number;
  readonly thresholds: LivenessThresholds;
  /** `null` si el almacén de latidos no respondió. */
  readonly heartbeats: Readonly<Record<string, string>> | null;
  /** Sondas ejecutadas, por id de instancia. Lo que no está acá no se sondó. */
  readonly probes: Readonly<Record<string, ProbeOutcome>>;
  /** Arranque del proceso de la API que responde esta consulta. */
  readonly apiStartedAt: string;
}

const NO_EVIDENCE: InstanceEvidence = {
  source: 'none',
  reportedStatus: null,
  startedAt: null,
  latencyMs: null,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Interpreta el JSON guardado por la ingesta. Devuelve `null` si no cumple el
 * esquema mínimo: una fila que no se entiende es «sin dato», nunca «viva».
 */
export function parseHeartbeatRecord(raw: string): HeartbeatRecord | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(parsed)) return null;
  const { receivedAt, status, startedAt, liveness, readiness } = parsed;
  if (typeof receivedAt !== 'number' || !Number.isFinite(receivedAt)) {
    return null;
  }
  if (typeof status !== 'string' || !REPORTED_STATUSES.includes(status)) {
    return null;
  }
  if (!isRecord(liveness) || typeof liveness.healthy !== 'boolean') return null;
  if (!isRecord(readiness) || typeof readiness.healthy !== 'boolean') {
    return null;
  }
  return {
    receivedAt,
    status: status as ReportedStatus,
    startedAt: typeof startedAt === 'string' ? startedAt : null,
    liveness: { healthy: liveness.healthy },
    readiness: { healthy: readiness.healthy },
  };
}

const seconds = (ms: number): number => Math.floor(ms / 1000);
const iso = (epochMs: number): string => new Date(epochMs).toISOString();

function verdict(
  definition: InstanceDefinition,
  partial: Omit<InstanceEvaluation, 'id' | 'label' | 'type' | 'required'>,
): InstanceEvaluation {
  return {
    id: definition.id,
    label: definition.label,
    type: definition.type,
    required: definition.required,
    ...partial,
  };
}

function withoutHeartbeat(
  definition: InstanceDefinition,
  state: InstanceState,
  cause: LivenessCause,
  causeDetail: string,
): InstanceEvaluation {
  return verdict(definition, {
    state,
    lastHeartbeatAt: null,
    ageSeconds: null,
    thresholdSeconds: null,
    cause,
    causeDetail,
    evidence: NO_EVIDENCE,
  });
}

function evaluateWorker(
  definition: InstanceDefinition,
  context: EvaluationContext,
): InstanceEvaluation {
  const { thresholds, now } = context;
  if (context.heartbeats === null) {
    return withoutHeartbeat(
      definition,
      'SIN_DATO',
      'STORE_UNAVAILABLE',
      'el almacén de latidos (Redis) no respondió: no se sabe si la instancia vive',
    );
  }
  const raw = context.heartbeats[definition.id];
  if (raw === undefined) {
    return withoutHeartbeat(
      definition,
      'SIN_DATO',
      'NEVER_SEEN',
      'ningún latido recibido de esta instancia',
    );
  }
  const record = parseHeartbeatRecord(raw);
  if (record === null) {
    return withoutHeartbeat(
      definition,
      'SIN_DATO',
      'RECORD_CORRUPT',
      'el latido guardado no cumple el esquema esperado',
    );
  }

  const lastHeartbeatAt = iso(record.receivedAt);
  const thresholdSeconds = seconds(thresholds.downAfterMs);
  const evidence: InstanceEvidence = {
    source: 'heartbeat',
    reportedStatus: record.status,
    startedAt: record.startedAt,
    latencyMs: null,
  };
  const rawAge = now - record.receivedAt;

  if (rawAge < -thresholds.clockToleranceMs) {
    return verdict(definition, {
      state: 'SIN_DATO',
      lastHeartbeatAt,
      ageSeconds: null,
      thresholdSeconds,
      cause: 'CLOCK_INCONSISTENT',
      causeDetail: `el latido se recibió ${seconds(-rawAge)} s en el futuro respecto del reloj de la API`,
      evidence,
    });
  }

  const age = Math.max(0, rawAge);
  const ageSeconds = seconds(age);
  const decided = (
    state: InstanceState,
    cause: LivenessCause,
    causeDetail: string,
  ) =>
    verdict(definition, {
      state,
      lastHeartbeatAt,
      ageSeconds,
      thresholdSeconds,
      cause,
      causeDetail,
      evidence,
    });

  if (age > thresholds.downAfterMs) {
    return decided(
      'CAIDA',
      'HEARTBEAT_EXPIRED',
      `sin latido desde hace ${ageSeconds} s (umbral ${thresholdSeconds} s)`,
    );
  }
  if (age > thresholds.degradedAfterMs) {
    return decided(
      'DEGRADADA',
      'HEARTBEAT_LATE',
      `último latido hace ${ageSeconds} s, por encima de ${seconds(thresholds.degradedAfterMs)} s`,
    );
  }
  if (record.status !== 'running') {
    return decided(
      'DEGRADADA',
      'DRAINING',
      `la instancia informa estado «${record.status}»`,
    );
  }
  if (!record.liveness.healthy) {
    return decided(
      'DEGRADADA',
      'TICK_STUCK',
      'la instancia informa un tick en vuelo por encima de su umbral',
    );
  }
  if (!record.readiness.healthy) {
    return decided(
      'DEGRADADA',
      'CIRCUIT_OPEN',
      'la instancia informa que no está lista (cortacircuitos abierto o proveedor sin binding real)',
    );
  }
  return decided('VIVA', 'OK', `latido fresco hace ${ageSeconds} s`);
}

const isTimeoutError = (errorType: string | undefined): boolean =>
  errorType !== undefined && /timeout/i.test(errorType);

function evaluateDependency(
  definition: InstanceDefinition,
  context: EvaluationContext,
): InstanceEvaluation {
  const probe = context.probes[definition.id];
  if (probe === undefined) {
    return withoutHeartbeat(
      definition,
      'SIN_DATO',
      'NOT_PROBED',
      'esta versión de la sonda no comprueba esta instancia',
    );
  }
  const { thresholds } = context;
  const evidence: InstanceEvidence = {
    source: 'probe',
    reportedStatus: null,
    startedAt: null,
    latencyMs: probe.latencyMs,
  };
  const decided = (
    state: InstanceState,
    cause: LivenessCause,
    causeDetail: string,
  ) =>
    verdict(definition, {
      state,
      lastHeartbeatAt: null,
      ageSeconds: null,
      thresholdSeconds: seconds(thresholds.dependencyProbeTimeoutMs),
      cause,
      causeDetail,
      evidence,
    });

  if (probe.status === 'down') {
    return isTimeoutError(probe.errorType)
      ? decided(
          'CAIDA',
          'PROBE_TIMEOUT',
          `la sonda no respondió en ${thresholds.dependencyProbeTimeoutMs} ms`,
        )
      : decided('CAIDA', 'PROBE_FAILED', 'la sonda falló');
  }
  if (probe.latencyMs > thresholds.dependencyLatencyDegradedMs) {
    return decided(
      'DEGRADADA',
      'PROBE_SLOW',
      `la sonda respondió en ${probe.latencyMs} ms, por encima de ${thresholds.dependencyLatencyDegradedMs} ms`,
    );
  }
  return decided('VIVA', 'OK', `la sonda respondió en ${probe.latencyMs} ms`);
}

function evaluateApi(
  definition: InstanceDefinition,
  context: EvaluationContext,
): InstanceEvaluation {
  return verdict(definition, {
    state: 'VIVA',
    lastHeartbeatAt: null,
    ageSeconds: null,
    thresholdSeconds: null,
    cause: 'OK',
    causeDetail:
      'la instancia que respondió esta consulta; no dice nada de otras réplicas',
    evidence: {
      source: 'self',
      reportedStatus: 'running',
      startedAt: context.apiStartedAt,
      latencyMs: null,
    },
  });
}

/**
 * Decide el estado de una instancia a partir de lo ya leído.
 *
 * Workers: `age = now − receivedAt` en ms. Almacén caído → `SIN_DATO /
 * STORE_UNAVAILABLE`; sin fila → `NEVER_SEEN`; fila ilegible → `RECORD_CORRUPT`;
 * latido del futuro más allá de la tolerancia → `CLOCK_INCONSISTENT` (dentro de
 * ella, edad 0); `age > downAfter` → `CAIDA`; `degradedAfter < age ≤ downAfter` →
 * `DEGRADADA / HEARTBEAT_LATE`; fresco pero no `running` → `DRAINING`; liveness
 * enferma → `TICK_STUCK`; readiness enferma → `CIRCUIT_OPEN`; si no, `VIVA`.
 *
 * Dependencias: sonda `up` ≤ 1000 ms → `VIVA`, más lenta → `PROBE_SLOW`; `down`
 * por timeout → `PROBE_TIMEOUT`, otro → `PROBE_FAILED`; sin sonda → `NOT_PROBED`.
 *
 * API: `VIVA / OK` con `source:'self'`, tautológico por diseño.
 */
export function evaluateInstance(
  definition: InstanceDefinition,
  context: EvaluationContext,
): InstanceEvaluation {
  switch (definition.type) {
    case 'WORKER':
      return evaluateWorker(definition, context);
    case 'API':
      return evaluateApi(definition, context);
    case 'DATABASE':
    case 'SERVICE':
      return evaluateDependency(definition, context);
  }
}

/**
 * Veredicto global sobre las instancias `required`: `CRITICO` si alguna está
 * `CAIDA`; `SIN_DATO` si ninguna es evaluable (no hay requeridas, o todas son
 * `SIN_DATO`); `ATENCION` si alguna está `DEGRADADA` o `SIN_DATO`; `OK` sólo si
 * **todas** están `VIVA`. Lo no requerido nunca sube el veredicto.
 */
export function overallOf(
  instances: ReadonlyArray<Pick<InstanceEvaluation, 'state' | 'required'>>,
): OverallState {
  const required = instances.filter((instance) => instance.required);
  if (required.some((instance) => instance.state === 'CAIDA')) return 'CRITICO';
  if (required.every((instance) => instance.state === 'SIN_DATO')) {
    return 'SIN_DATO';
  }
  if (
    required.some(
      (instance) =>
        instance.state === 'DEGRADADA' || instance.state === 'SIN_DATO',
    )
  ) {
    return 'ATENCION';
  }
  return 'OK';
}

export interface LivenessSummary {
  VIVA: number;
  DEGRADADA: number;
  CAIDA: number;
  SIN_DATO: number;
  total: number;
}

export function summarize(
  instances: ReadonlyArray<Pick<InstanceEvaluation, 'state'>>,
): LivenessSummary {
  const summary: LivenessSummary = {
    VIVA: 0,
    DEGRADADA: 0,
    CAIDA: 0,
    SIN_DATO: 0,
    total: instances.length,
  };
  for (const instance of instances) summary[instance.state] += 1;
  return summary;
}
