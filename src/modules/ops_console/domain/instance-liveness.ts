import type { InstanceDefinition, InstanceType } from './instance-registry';

/**
 * Sonda de vida de instancias: reglas de decisión, sin I/O.
 *
 * Principio rector: **un estado `VIVA` sólo se emite con evidencia fresca,
 * verificable y calculada con el reloj de la API.** Todo lo demás degrada; nada
 * se rellena. Redis caído, registro ilegible, reloj incoherente o instancia
 * nunca vista son `SIN_DATO` —no se sabe—, jamás `VIVA` y tampoco `CAIDA`
 * («nunca vista» no es «se cayó»).
 *
 * Todas las comparaciones se hacen en milisegundos y sin redondear antes.
 */

export type LivenessState = 'VIVA' | 'DEGRADADA' | 'CAIDA' | 'SIN_DATO';

/** Umbrales del contrato (los asumen el worker y el front). */
export const LIVENESS_THRESHOLDS = {
  heartbeatIntervalSeconds: 15,
  /** edad ≤ este valor ⇒ VIVA. */
  liveSeconds: 30,
  /** liveSeconds < edad ≤ este valor ⇒ DEGRADADA; por encima ⇒ CAIDA. */
  degradedSeconds: 60,
} as const;

/** Un `receivedAt` más adelantado que esto respecto de `now` es incoherente. */
export const CLOCK_TOLERANCE_MS = 5_000;
/** Mismo plazo que `/readiness` (`READINESS_TIMEOUT_MS`). */
export const PROBE_TIMEOUT_MS = 3_000;
/** Una dependencia que responde más lento que esto está degradada. */
export const PROBE_SLOW_MS = 1_000;

const LIVE_MS = LIVENESS_THRESHOLDS.liveSeconds * 1000;
const DEGRADED_MS = LIVENESS_THRESHOLDS.degradedSeconds * 1000;

export type LivenessCause =
  | 'HEARTBEAT_LATE'
  | 'HEARTBEAT_EXPIRED'
  | 'NEVER_SEEN'
  | 'STORE_UNAVAILABLE'
  | 'CLOCK_INCONSISTENT'
  | 'RECORD_CORRUPT'
  | 'PROBE_FAILED'
  | 'PROBE_TIMEOUT'
  | 'PROBE_SLOW'
  | 'PROBE_UNAVAILABLE';

export interface InstanceLivenessView {
  id: string;
  type: InstanceType;
  required: boolean;
  state: LivenessState;
  lastHeartbeatAt: string | null;
  ageSeconds: number | null;
  thresholdSeconds: number;
  cause: LivenessCause | null;
  evidence: string;
}

export interface NotMeasuredView {
  id: string;
  reason: string;
}

export interface InstanceLivenessReport {
  evaluatedAt: string;
  thresholds: typeof LIVENESS_THRESHOLDS;
  overall: LivenessState;
  instances: InstanceLivenessView[];
  notMeasured: NotMeasuredView[];
}

/** Registro que guarda la ingesta. `receivedAt` es SIEMPRE el reloj de la API. */
export interface StoredHeartbeat {
  instanceId: string;
  type: InstanceType;
  version?: string;
  receivedAt: number;
}

const INSTANCE_TYPES: readonly string[] = [
  'api',
  'worker',
  'database',
  'service',
];

/**
 * Interpreta lo que hay en el almacén. Devuelve `null` ante cualquier cosa que
 * no sea un registro íntegro: JSON inválido, campos que faltan o con tipo
 * erróneo, `receivedAt` no entero positivo.
 */
export function parseStoredHeartbeat(raw: string): StoredHeartbeat | null {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  const { instanceId, type, version, receivedAt } = record;
  if (typeof instanceId !== 'string' || instanceId === '') return null;
  if (typeof type !== 'string' || !INSTANCE_TYPES.includes(type)) return null;
  if (
    typeof receivedAt !== 'number' ||
    !Number.isSafeInteger(receivedAt) ||
    receivedAt <= 0
  ) {
    return null;
  }
  if (version !== undefined && typeof version !== 'string') return null;
  return {
    instanceId,
    type: type as InstanceType,
    ...(version !== undefined ? { version } : {}),
    receivedAt,
  };
}

/** Lo que el repositorio de latidos entregó para esta consulta. */
export interface HeartbeatStoreRead {
  /** `false` si la lectura falló: nadie puede afirmar nada sobre ningún worker. */
  available: boolean;
  /** `instanceId` → JSON crudo guardado. */
  records: ReadonlyMap<string, string>;
}

/** Resultado de una sonda activa de dependencia. */
export interface ProbeResult {
  status: 'up' | 'down';
  latencyMs: number;
  /** Instante (ms epoch, reloj de la API) en que se hizo la sonda. */
  observedAtMs: number;
}

const iso = (ms: number): string => new Date(ms).toISOString();
const ceilSeconds = (ms: number): number => Math.ceil(ms / 1000);

function view(
  def: InstanceDefinition,
  partial: Pick<InstanceLivenessView, 'state' | 'cause' | 'evidence'> &
    Partial<
      Pick<
        InstanceLivenessView,
        'lastHeartbeatAt' | 'ageSeconds' | 'thresholdSeconds'
      >
    >,
): InstanceLivenessView {
  return {
    id: def.id,
    type: def.type,
    required: def.required,
    lastHeartbeatAt: null,
    ageSeconds: null,
    thresholdSeconds: LIVENESS_THRESHOLDS.degradedSeconds,
    ...partial,
  };
}

/** Estado de una instancia que vive de latidos (workers). */
export function evaluateHeartbeatInstance(
  def: InstanceDefinition,
  store: HeartbeatStoreRead,
  nowMs: number,
): InstanceLivenessView {
  if (!store.available) {
    return view(def, {
      state: 'SIN_DATO',
      cause: 'STORE_UNAVAILABLE',
      evidence:
        'No se pudo leer el almacén de latidos: no se sabe si la instancia vive.',
    });
  }
  const raw = store.records.get(def.id);
  if (raw === undefined) {
    return view(def, {
      state: 'SIN_DATO',
      cause: 'NEVER_SEEN',
      evidence:
        'La API nunca recibió un latido de esta instancia (no es lo mismo que caída).',
    });
  }
  const record = parseStoredHeartbeat(raw);
  if (
    record === null ||
    record.instanceId !== def.id ||
    record.type !== def.type
  ) {
    return view(def, {
      state: 'SIN_DATO',
      cause: 'RECORD_CORRUPT',
      evidence:
        'El registro de latido guardado es ilegible o no coincide con la instancia.',
    });
  }

  const rawAgeMs = nowMs - record.receivedAt;
  if (rawAgeMs < -CLOCK_TOLERANCE_MS) {
    return view(def, {
      state: 'SIN_DATO',
      cause: 'CLOCK_INCONSISTENT',
      lastHeartbeatAt: iso(record.receivedAt),
      evidence:
        'El instante del último latido está en el futuro respecto del reloj de la API: no se puede medir su edad.',
    });
  }
  const ageMs = Math.max(0, rawAgeMs);
  const ageSeconds = ceilSeconds(ageMs);
  const common = {
    lastHeartbeatAt: iso(record.receivedAt),
    ageSeconds,
  };

  if (ageMs > DEGRADED_MS) {
    return view(def, {
      ...common,
      state: 'CAIDA',
      cause: 'HEARTBEAT_EXPIRED',
      evidence: `Sin latido recibido desde hace ${ageSeconds} s (límite ${LIVENESS_THRESHOLDS.degradedSeconds} s). Es ausencia de latidos, no una observación del proceso.`,
    });
  }
  if (ageMs > LIVE_MS) {
    return view(def, {
      ...common,
      state: 'DEGRADADA',
      cause: 'HEARTBEAT_LATE',
      evidence: `Último latido hace ${ageSeconds} s (vive hasta ${LIVENESS_THRESHOLDS.liveSeconds} s, cae pasados ${LIVENESS_THRESHOLDS.degradedSeconds} s).`,
    });
  }
  return view(def, {
    ...common,
    state: 'VIVA',
    cause: null,
    evidence: `Latido recibido por la API hace ${ageSeconds} s (reloj de la API).`,
  });
}

/** Estado de una dependencia por sonda activa (`null` = la sonda no pudo ejecutarse). */
export function evaluateProbeInstance(
  def: InstanceDefinition,
  probe: ProbeResult | null,
  nowMs: number,
): InstanceLivenessView {
  const thresholdSeconds = PROBE_TIMEOUT_MS / 1000;
  if (probe === null) {
    return view(def, {
      state: 'SIN_DATO',
      cause: 'PROBE_UNAVAILABLE',
      thresholdSeconds,
      evidence: 'La sonda no se pudo ejecutar: no hay evidencia de vida.',
    });
  }
  const ageMs = Math.max(0, nowMs - probe.observedAtMs);
  const common = {
    lastHeartbeatAt: iso(probe.observedAtMs),
    ageSeconds: ceilSeconds(ageMs),
    thresholdSeconds,
  };
  if (probe.status === 'down') {
    const timedOut = probe.latencyMs >= PROBE_TIMEOUT_MS;
    return view(def, {
      ...common,
      state: 'CAIDA',
      cause: timedOut ? 'PROBE_TIMEOUT' : 'PROBE_FAILED',
      evidence: timedOut
        ? `La sonda no respondió en ${PROBE_TIMEOUT_MS} ms.`
        : `La sonda falló a los ${probe.latencyMs} ms.`,
    });
  }
  if (probe.latencyMs > PROBE_SLOW_MS) {
    return view(def, {
      ...common,
      state: 'DEGRADADA',
      cause: 'PROBE_SLOW',
      evidence: `La sonda respondió en ${probe.latencyMs} ms (lento por encima de ${PROBE_SLOW_MS} ms).`,
    });
  }
  return view(def, {
    ...common,
    state: 'VIVA',
    cause: null,
    evidence: `La sonda respondió en ${probe.latencyMs} ms.`,
  });
}

/** La API que contestó esta consulta: tautológico, y se rotula como tal. */
export function evaluateSelfInstance(
  def: InstanceDefinition,
  nowMs: number,
): InstanceLivenessView {
  return view(def, {
    state: 'VIVA',
    cause: null,
    lastHeartbeatAt: iso(nowMs),
    ageSeconds: 0,
    evidence:
      'La instancia de API que respondió esta consulta. No evidencia otras réplicas.',
  });
}

/**
 * Agregado de las instancias `required`. Peor caso gana, salvo que `VIVA` sólo
 * se emite si **todas** las requeridas están `VIVA`:
 *  - alguna `CAIDA` ⇒ `CAIDA`; alguna `DEGRADADA` ⇒ `DEGRADADA`;
 *  - ninguna requerida con evidencia (todas `SIN_DATO`, o ninguna) ⇒ `SIN_DATO`;
 *  - mezcla de `VIVA` y `SIN_DATO` ⇒ `DEGRADADA` (no se puede afirmar `VIVA`).
 */
export function overallOf(
  instances: readonly Pick<InstanceLivenessView, 'required' | 'state'>[],
): LivenessState {
  const required = instances.filter((i) => i.required);
  if (required.some((i) => i.state === 'CAIDA')) return 'CAIDA';
  if (required.some((i) => i.state === 'DEGRADADA')) return 'DEGRADADA';
  if (required.length === 0 || required.every((i) => i.state === 'SIN_DATO')) {
    return 'SIN_DATO';
  }
  if (required.some((i) => i.state === 'SIN_DATO')) return 'DEGRADADA';
  return 'VIVA';
}

export interface BuildReportInput {
  registry: readonly InstanceDefinition[];
  heartbeats: HeartbeatStoreRead;
  /** `id` → resultado de la sonda (ausente o `null` = no ejecutada). */
  probes: ReadonlyMap<string, ProbeResult | null>;
  notMeasured: readonly NotMeasuredView[];
  nowMs: number;
}

export function buildLivenessReport(
  input: BuildReportInput,
): InstanceLivenessReport {
  const instances = input.registry.map((def) => {
    switch (def.source) {
      case 'self':
        return evaluateSelfInstance(def, input.nowMs);
      case 'probe':
        return evaluateProbeInstance(
          def,
          input.probes.get(def.id) ?? null,
          input.nowMs,
        );
      case 'heartbeat':
        return evaluateHeartbeatInstance(def, input.heartbeats, input.nowMs);
    }
  });
  return {
    evaluatedAt: iso(input.nowMs),
    thresholds: LIVENESS_THRESHOLDS,
    overall: overallOf(instances),
    instances,
    notMeasured: input.notMeasured.map((m) => ({ ...m })),
  };
}
