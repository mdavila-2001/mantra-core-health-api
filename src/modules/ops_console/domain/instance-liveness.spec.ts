import { describe, expect, it } from '@jest/globals';
import {
  LIVENESS_CAUSES,
  evaluateInstance,
  overallOf,
  parseHeartbeatRecord,
  summarize,
  type EvaluationContext,
  type InstanceEvaluation,
  type LivenessThresholds,
} from './instance-liveness';
import {
  INFRASTRUCTURE_INSTANCES,
  WORKER_INSTANCES,
  type InstanceDefinition,
} from './instance-registry';

const NOW = Date.parse('2026-10-30T12:05:20.000Z');
const THRESHOLDS: LivenessThresholds = {
  workerHeartbeatIntervalMs: 15_000,
  degradedAfterMs: 30_000,
  downAfterMs: 60_000,
  dependencyLatencyDegradedMs: 1_000,
  dependencyProbeTimeoutMs: 3_000,
  clockToleranceMs: 5_000,
};
const MESSAGING = WORKER_INSTANCES.find((w) => w.id === 'worker-messaging')!;
const FILES = WORKER_INSTANCES.find((w) => w.id === 'worker-files')!;
const infra = (id: string): InstanceDefinition =>
  INFRASTRUCTURE_INSTANCES.find((i) => i.id === id)!;

function record(over: Record<string, unknown> = {}): string {
  return JSON.stringify({
    instanceId: 'worker-messaging',
    pid: 41,
    startedAt: '2026-10-30T12:00:00.000Z',
    sentAt: '2026-10-30T12:05:15.000Z',
    status: 'running',
    liveness: { healthy: true, reasons: [] },
    readiness: { healthy: true, reasons: [] },
    stuckTicks: 0,
    openCircuits: [],
    receivedAt: NOW - 5_000,
    ...over,
  });
}

function context(over: Partial<EvaluationContext> = {}): EvaluationContext {
  return {
    now: NOW,
    thresholds: THRESHOLDS,
    heartbeats: {},
    probes: {},
    apiStartedAt: '2026-10-30T11:00:00.000Z',
    ...over,
  };
}

const worker = (
  raw: string | undefined,
  over: Partial<EvaluationContext> = {},
) =>
  evaluateInstance(
    MESSAGING,
    context({
      heartbeats: raw === undefined ? {} : { 'worker-messaging': raw },
      ...over,
    }),
  );

const aged = (ageMs: number) => worker(record({ receivedAt: NOW - ageMs }));

describe('evaluateInstance · workers', () => {
  it('U1: latido fresco, running y sondas sanas → VIVA / OK con la edad en segundos', () => {
    const result = aged(5_000);
    expect(result).toMatchObject({
      state: 'VIVA',
      cause: 'OK',
      ageSeconds: 5,
      thresholdSeconds: 60,
      lastHeartbeatAt: new Date(NOW - 5_000).toISOString(),
      evidence: {
        source: 'heartbeat',
        reportedStatus: 'running',
        startedAt: '2026-10-30T12:00:00.000Z',
        latencyMs: null,
      },
    });
  });

  it('U2/U3: 30 000 ms sigue VIVA (≤), 30 001 ms es DEGRADADA / HEARTBEAT_LATE', () => {
    expect(aged(30_000).state).toBe('VIVA');
    expect(aged(30_001)).toMatchObject({
      state: 'DEGRADADA',
      cause: 'HEARTBEAT_LATE',
      ageSeconds: 30,
    });
  });

  it('U4/U5: 60 000 ms sigue DEGRADADA, 60 001 ms es CAIDA / HEARTBEAT_EXPIRED', () => {
    expect(aged(60_000)).toMatchObject({
      state: 'DEGRADADA',
      cause: 'HEARTBEAT_LATE',
    });
    expect(aged(60_001)).toMatchObject({
      state: 'CAIDA',
      cause: 'HEARTBEAT_EXPIRED',
      ageSeconds: 60,
      causeDetail: expect.stringContaining('sin latido desde hace 60 s'),
    });
  });

  it('U6: edad 0 → VIVA', () => {
    expect(aged(0)).toMatchObject({ state: 'VIVA', ageSeconds: 0 });
  });

  it('U7: latido 4 999 ms en el futuro (dentro de la tolerancia) → VIVA con edad 0, nunca negativa', () => {
    expect(aged(-4_999)).toMatchObject({
      state: 'VIVA',
      cause: 'OK',
      ageSeconds: 0,
    });
  });

  it('U8: latido 5 001 ms en el futuro → SIN_DATO / CLOCK_INCONSISTENT, jamás VIVA', () => {
    expect(aged(-5_001)).toMatchObject({
      state: 'SIN_DATO',
      cause: 'CLOCK_INCONSISTENT',
      ageSeconds: null,
    });
  });

  it('U9: un sentAt del worker una hora distinto no cambia el estado (se ignora)', () => {
    const result = worker(
      record({ receivedAt: NOW - 5_000, sentAt: '2026-10-30T11:05:15.000Z' }),
    );
    expect(result).toMatchObject({ state: 'VIVA', ageSeconds: 5 });
  });

  it('U10: sin registro y required → SIN_DATO / NEVER_SEEN sin latido ni edad', () => {
    expect(worker(undefined)).toMatchObject({
      required: true,
      state: 'SIN_DATO',
      cause: 'NEVER_SEEN',
      lastHeartbeatAt: null,
      ageSeconds: null,
      thresholdSeconds: null,
      evidence: { source: 'none' },
    });
  });

  it('U11: sin registro y required:false → SIN_DATO / NEVER_SEEN y no pesa en overall', () => {
    const result = evaluateInstance(FILES, context());
    expect(result).toMatchObject({
      required: false,
      state: 'SIN_DATO',
      cause: 'NEVER_SEEN',
    });
    expect(overallOf([{ state: 'VIVA', required: true }, result])).toBe('OK');
  });

  it.each([
    ['JSON inválido', '{no es json'],
    ['sin receivedAt', record({ receivedAt: undefined })],
    ['receivedAt no numérico', record({ receivedAt: '2026-10-30T12:05:15Z' })],
    ['receivedAt NaN', record({ receivedAt: 'NaN' })],
    ['status fuera del enumerado', record({ status: 'zombie' })],
    ['sin liveness', record({ liveness: undefined })],
    ['un arreglo', '[1,2,3]'],
  ])('U12: registro ilegible (%s) → SIN_DATO / RECORD_CORRUPT', (_n, raw) => {
    expect(worker(raw)).toMatchObject({
      state: 'SIN_DATO',
      cause: 'RECORD_CORRUPT',
      lastHeartbeatAt: null,
      ageSeconds: null,
    });
  });

  it('U13: fresco con liveness enferma → DEGRADADA / TICK_STUCK', () => {
    expect(
      worker(record({ liveness: { healthy: false, reasons: ['x'] } })),
    ).toMatchObject({ state: 'DEGRADADA', cause: 'TICK_STUCK' });
  });

  it('U14: fresco con readiness enferma → DEGRADADA / CIRCUIT_OPEN', () => {
    expect(
      worker(record({ readiness: { healthy: false, reasons: ['x'] } })),
    ).toMatchObject({ state: 'DEGRADADA', cause: 'CIRCUIT_OPEN' });
  });

  it('U15: fresco en draining → DEGRADADA / DRAINING', () => {
    expect(worker(record({ status: 'draining' }))).toMatchObject({
      state: 'DEGRADADA',
      cause: 'DRAINING',
      evidence: { reportedStatus: 'draining' },
    });
  });

  it('U16: fresco en starting → no VIVA', () => {
    expect(worker(record({ status: 'starting' })).state).not.toBe('VIVA');
  });

  it('U17: almacén caído → todos los workers SIN_DATO / STORE_UNAVAILABLE, ninguno VIVA ni CAIDA', () => {
    const results = WORKER_INSTANCES.map((definition) =>
      evaluateInstance(definition, context({ heartbeats: null })),
    );
    expect(results).toHaveLength(26);
    for (const result of results) {
      expect(result).toMatchObject({
        state: 'SIN_DATO',
        cause: 'STORE_UNAVAILABLE',
      });
    }
  });

  it('el estado de un worker con dato nunca expone pid ni mensajes crudos', () => {
    const result = aged(5_000);
    expect(JSON.stringify(result)).not.toContain('"pid"');
    expect(Object.keys(result).sort()).toEqual(
      [
        'ageSeconds',
        'cause',
        'causeDetail',
        'evidence',
        'id',
        'label',
        'lastHeartbeatAt',
        'required',
        'state',
        'thresholdSeconds',
        'type',
      ].sort(),
    );
  });
});

describe('evaluateInstance · dependencias y API', () => {
  const probe = (id: string, outcome: EvaluationContext['probes'][string]) =>
    evaluateInstance(infra(id), context({ probes: { [id]: outcome } }));

  it('U18: sonda up en 120 ms → VIVA; 1 000 ms → VIVA; 1 001 ms → DEGRADADA / PROBE_SLOW', () => {
    expect(probe('postgresql', { status: 'up', latencyMs: 120 })).toMatchObject(
      {
        state: 'VIVA',
        cause: 'OK',
        thresholdSeconds: 3,
        evidence: { source: 'probe', latencyMs: 120 },
      },
    );
    expect(probe('postgresql', { status: 'up', latencyMs: 1_000 }).state).toBe(
      'VIVA',
    );
    expect(
      probe('postgresql', { status: 'up', latencyMs: 1_001 }),
    ).toMatchObject({ state: 'DEGRADADA', cause: 'PROBE_SLOW' });
  });

  it('U19: sonda down por timeout → CAIDA / PROBE_TIMEOUT; por otro error → CAIDA / PROBE_FAILED, sin el mensaje', () => {
    expect(
      probe('redis', {
        status: 'down',
        latencyMs: 3_001,
        errorType: 'ProbeTimeoutError',
      }),
    ).toMatchObject({ state: 'CAIDA', cause: 'PROBE_TIMEOUT' });
    const failed = probe('mongodb', {
      status: 'down',
      latencyMs: 12,
      errorType: 'MongoServerSelectionError',
    });
    expect(failed).toMatchObject({ state: 'CAIDA', cause: 'PROBE_FAILED' });
    expect(JSON.stringify(failed)).not.toContain('MongoServerSelectionError');
  });

  it.each(['minio', 'clamav', 'mock-provider-server'])(
    'U20: %s sin sonda → SIN_DATO / NOT_PROBED y required:false',
    (id) => {
      expect(evaluateInstance(infra(id), context())).toMatchObject({
        required: false,
        state: 'SIN_DATO',
        cause: 'NOT_PROBED',
        evidence: { source: 'none' },
      });
    },
  );

  it('la API que responde es VIVA / OK con evidencia propia y su arranque', () => {
    expect(evaluateInstance(infra('api'), context())).toMatchObject({
      state: 'VIVA',
      cause: 'OK',
      evidence: {
        source: 'self',
        reportedStatus: 'running',
        startedAt: '2026-10-30T11:00:00.000Z',
      },
    });
  });
});

describe('overallOf y summarize', () => {
  const r = (state: InstanceEvaluation['state'], required = true) => ({
    state,
    required,
  });

  it('U21: todas VIVA → OK; una DEGRADADA requerida → ATENCION; una CAIDA requerida → CRITICO', () => {
    expect(overallOf([r('VIVA'), r('VIVA')])).toBe('OK');
    expect(overallOf([r('VIVA'), r('DEGRADADA')])).toBe('ATENCION');
    expect(overallOf([r('VIVA'), r('SIN_DATO')])).toBe('ATENCION');
    expect(overallOf([r('VIVA'), r('DEGRADADA'), r('CAIDA')])).toBe('CRITICO');
  });

  it('U21: una CAIDA en required:false no sube a CRITICO', () => {
    expect(overallOf([r('VIVA'), r('CAIDA', false)])).toBe('OK');
  });

  it('U21: lista vacía o sin nada evaluable nunca es OK', () => {
    expect(overallOf([])).toBe('SIN_DATO');
    expect(overallOf([r('SIN_DATO'), r('SIN_DATO')])).toBe('SIN_DATO');
    expect(overallOf([r('VIVA', false)])).toBe('SIN_DATO');
  });

  it('cuenta cada estado y el total', () => {
    expect(
      summarize([
        r('VIVA'),
        r('VIVA'),
        r('DEGRADADA'),
        r('CAIDA'),
        r('SIN_DATO'),
      ]),
    ).toEqual({ VIVA: 2, DEGRADADA: 1, CAIDA: 1, SIN_DATO: 1, total: 5 });
  });
});

describe('U23: contrato de forma', () => {
  it('toda instancia trae los 11 campos, state en 4 valores y cause en el catálogo', () => {
    const heartbeats: Record<string, string> = {
      'worker-messaging': record(),
      'worker-billing': record({ receivedAt: NOW - 61_000 }),
      'worker-consent': '{corrupto',
    };
    const probes = {
      postgresql: { status: 'up' as const, latencyMs: 10 },
      redis: {
        status: 'down' as const,
        latencyMs: 3_000,
        errorType: 'ProbeTimeoutError',
      },
    };
    const all = [...INFRASTRUCTURE_INSTANCES, ...WORKER_INSTANCES].map((d) =>
      evaluateInstance(d, context({ heartbeats, probes })),
    );
    expect(all).toHaveLength(34);
    for (const instance of all) {
      expect(['VIVA', 'DEGRADADA', 'CAIDA', 'SIN_DATO']).toContain(
        instance.state,
      );
      expect(LIVENESS_CAUSES).toContain(instance.cause);
      expect(['heartbeat', 'probe', 'self', 'none']).toContain(
        instance.evidence.source,
      );
      expect(typeof instance.causeDetail).toBe('string');
    }
  });
});

describe('parseHeartbeatRecord', () => {
  it('conserva sólo lo que decide: receivedAt, status, startedAt y las dos sondas', () => {
    expect(parseHeartbeatRecord(record())).toEqual({
      receivedAt: NOW - 5_000,
      status: 'running',
      startedAt: '2026-10-30T12:00:00.000Z',
      liveness: { healthy: true },
      readiness: { healthy: true },
    });
  });
});
