import { describe, expect, it } from '@jest/globals';
import {
  buildLivenessReport,
  CLOCK_TOLERANCE_MS,
  evaluateHeartbeatInstance,
  evaluateProbeInstance,
  evaluateSelfInstance,
  LIVENESS_THRESHOLDS,
  overallOf,
  parseStoredHeartbeat,
  type HeartbeatStoreRead,
  type InstanceLivenessView,
  type ProbeResult,
} from './instance-liveness';
import type { InstanceDefinition } from './instance-registry';

const NOW = Date.parse('2026-10-30T12:05:20.000Z');

const worker: InstanceDefinition = {
  id: 'worker-messaging',
  label: 'Worker messaging',
  type: 'worker',
  source: 'heartbeat',
  required: true,
};

function store(receivedAt: number, extra: Record<string, unknown> = {}) {
  return {
    available: true,
    records: new Map([
      [
        worker.id,
        JSON.stringify({
          instanceId: worker.id,
          type: 'worker',
          receivedAt,
          ...extra,
        }),
      ],
    ]),
  } satisfies HeartbeatStoreRead;
}

const evalAge = (ageMs: number) =>
  evaluateHeartbeatInstance(worker, store(NOW - ageMs), NOW);

describe('umbrales del latido (bordes exactos)', () => {
  it('U1: latido hace 5 s es VIVA sin causa', () => {
    const v = evalAge(5_000);
    expect(v).toMatchObject({
      state: 'VIVA',
      cause: null,
      ageSeconds: 5,
      thresholdSeconds: 60,
      lastHeartbeatAt: new Date(NOW - 5_000).toISOString(),
    });
  });

  it.each([
    [0, 'VIVA', null],
    [29_999, 'VIVA', null],
    [30_000, 'VIVA', null],
    [30_001, 'DEGRADADA', 'HEARTBEAT_LATE'],
    [45_000, 'DEGRADADA', 'HEARTBEAT_LATE'],
    [60_000, 'DEGRADADA', 'HEARTBEAT_LATE'],
    [60_001, 'CAIDA', 'HEARTBEAT_EXPIRED'],
    [3_600_000, 'CAIDA', 'HEARTBEAT_EXPIRED'],
  ] as const)('edad %i ms => %s', (age, state, cause) => {
    const v = evalAge(age);
    expect(v.state).toBe(state);
    expect(v.cause).toBe(cause);
  });

  it('ageSeconds es coherente con el umbral: > 30 si y sólo si no es VIVA', () => {
    expect(evalAge(30_000).ageSeconds).toBe(30);
    expect(evalAge(30_001).ageSeconds).toBe(31);
    expect(evalAge(60_000).ageSeconds).toBe(60);
    expect(evalAge(60_001).ageSeconds).toBe(61);
  });

  it('U7: reloj adelantado dentro de la tolerancia (+4 999 ms) es VIVA con edad 0', () => {
    const v = evalAge(-(CLOCK_TOLERANCE_MS - 1));
    expect(v.state).toBe('VIVA');
    expect(v.ageSeconds).toBe(0);
  });

  it('U7b: exactamente +5 000 ms sigue dentro de la tolerancia', () => {
    expect(evalAge(-CLOCK_TOLERANCE_MS).state).toBe('VIVA');
  });

  it('U8: +5 001 ms es SIN_DATO / CLOCK_INCONSISTENT, jamás VIVA', () => {
    const v = evalAge(-(CLOCK_TOLERANCE_MS + 1));
    expect(v.state).toBe('SIN_DATO');
    expect(v.cause).toBe('CLOCK_INCONSISTENT');
  });

  it('U9: un sentAt/clientAt dentro del registro no decide nada (sólo receivedAt)', () => {
    const v = evaluateHeartbeatInstance(
      worker,
      store(NOW - 1_000, { sentAt: NOW - 3_600_000, clientAt: NOW + 9e9 }),
      NOW,
    );
    expect(v.state).toBe('VIVA');
    expect(v.ageSeconds).toBe(1);
  });
});

describe('sin evidencia nunca es VIVA', () => {
  it('U10: nunca vista => SIN_DATO / NEVER_SEEN, sin fecha ni edad', () => {
    const v = evaluateHeartbeatInstance(
      worker,
      { available: true, records: new Map() },
      NOW,
    );
    expect(v).toMatchObject({
      state: 'SIN_DATO',
      cause: 'NEVER_SEEN',
      lastHeartbeatAt: null,
      ageSeconds: null,
    });
  });

  it('U17: store caído => SIN_DATO / STORE_UNAVAILABLE aunque haya un registro viejo en memoria', () => {
    const v = evaluateHeartbeatInstance(
      worker,
      { available: false, records: store(NOW).records },
      NOW,
    );
    expect(v.state).toBe('SIN_DATO');
    expect(v.cause).toBe('STORE_UNAVAILABLE');
  });

  it.each([
    ['JSON inválido', '{no-json'],
    ['no es objeto', '[1,2]'],
    ['null', 'null'],
    [
      'falta receivedAt',
      JSON.stringify({ instanceId: 'worker-messaging', type: 'worker' }),
    ],
    [
      'receivedAt como texto',
      JSON.stringify({
        instanceId: 'worker-messaging',
        type: 'worker',
        receivedAt: 'ayer',
      }),
    ],
    [
      'receivedAt NaN serializado',
      JSON.stringify({
        instanceId: 'worker-messaging',
        type: 'worker',
        receivedAt: null,
      }),
    ],
    [
      'receivedAt negativo',
      JSON.stringify({
        instanceId: 'worker-messaging',
        type: 'worker',
        receivedAt: -5,
      }),
    ],
    [
      'receivedAt decimal',
      JSON.stringify({
        instanceId: 'worker-messaging',
        type: 'worker',
        receivedAt: 1.5,
      }),
    ],
    [
      'id distinto del campo',
      JSON.stringify({
        instanceId: 'worker-billing',
        type: 'worker',
        receivedAt: NOW,
      }),
    ],
    [
      'tipo distinto',
      JSON.stringify({
        instanceId: 'worker-messaging',
        type: 'database',
        receivedAt: NOW,
      }),
    ],
    ['cadena vacía', ''],
  ])('U12: registro corrupto (%s) => SIN_DATO / RECORD_CORRUPT', (_n, raw) => {
    const v = evaluateHeartbeatInstance(
      worker,
      { available: true, records: new Map([[worker.id, raw]]) },
      NOW,
    );
    expect(v.state).toBe('SIN_DATO');
    expect(v.cause).toBe('RECORD_CORRUPT');
  });

  it('parseStoredHeartbeat acepta el registro íntegro con version', () => {
    expect(
      parseStoredHeartbeat(
        JSON.stringify({
          instanceId: 'a',
          type: 'worker',
          receivedAt: 5,
          version: '1',
        }),
      ),
    ).toEqual({ instanceId: 'a', type: 'worker', receivedAt: 5, version: '1' });
  });
});

describe('dependencias por sonda', () => {
  const db: InstanceDefinition = {
    id: 'postgresql',
    label: 'PostgreSQL',
    type: 'database',
    source: 'probe',
    required: true,
  };
  const probe = (p: Partial<ProbeResult>): ProbeResult => ({
    status: 'up',
    latencyMs: 120,
    observedAtMs: NOW - 4_000,
    ...p,
  });

  it('U18: up 120 ms VIVA; 1 000 ms VIVA; 1 001 ms DEGRADADA / PROBE_SLOW', () => {
    expect(evaluateProbeInstance(db, probe({}), NOW).state).toBe('VIVA');
    expect(
      evaluateProbeInstance(db, probe({ latencyMs: 1000 }), NOW).state,
    ).toBe('VIVA');
    const slow = evaluateProbeInstance(db, probe({ latencyMs: 1001 }), NOW);
    expect(slow).toMatchObject({ state: 'DEGRADADA', cause: 'PROBE_SLOW' });
  });

  it('U19: down por timeout y down por otro error', () => {
    expect(
      evaluateProbeInstance(
        db,
        probe({ status: 'down', latencyMs: 3000 }),
        NOW,
      ),
    ).toMatchObject({ state: 'CAIDA', cause: 'PROBE_TIMEOUT' });
    expect(
      evaluateProbeInstance(db, probe({ status: 'down', latencyMs: 40 }), NOW),
    ).toMatchObject({ state: 'CAIDA', cause: 'PROBE_FAILED' });
  });

  it('la sonda que no pudo ejecutarse es SIN_DATO, no CAIDA ni VIVA', () => {
    expect(evaluateProbeInstance(db, null, NOW)).toMatchObject({
      state: 'SIN_DATO',
      cause: 'PROBE_UNAVAILABLE',
    });
  });

  it('la edad de la sonda sale del reloj de la API', () => {
    const v = evaluateProbeInstance(db, probe({}), NOW);
    expect(v.ageSeconds).toBe(4);
    expect(v.thresholdSeconds).toBe(3);
  });
});

describe('overall', () => {
  const inst = (
    required: boolean,
    state: InstanceLivenessView['state'],
  ): Pick<InstanceLivenessView, 'required' | 'state'> => ({ required, state });

  it('U21: todas VIVA => VIVA', () => {
    expect(overallOf([inst(true, 'VIVA'), inst(true, 'VIVA')])).toBe('VIVA');
  });
  it('una DEGRADADA requerida => DEGRADADA', () => {
    expect(overallOf([inst(true, 'VIVA'), inst(true, 'DEGRADADA')])).toBe(
      'DEGRADADA',
    );
  });
  it('una CAIDA requerida => CAIDA (aunque haya DEGRADADA y SIN_DATO)', () => {
    expect(
      overallOf([
        inst(true, 'CAIDA'),
        inst(true, 'DEGRADADA'),
        inst(true, 'SIN_DATO'),
      ]),
    ).toBe('CAIDA');
  });
  it('CAIDA en una no requerida no cuenta', () => {
    expect(overallOf([inst(true, 'VIVA'), inst(false, 'CAIDA')])).toBe('VIVA');
  });
  it('VIVA + SIN_DATO requerido no puede ser VIVA', () => {
    expect(overallOf([inst(true, 'VIVA'), inst(true, 'SIN_DATO')])).toBe(
      'DEGRADADA',
    );
  });
  it('todas SIN_DATO => SIN_DATO', () => {
    expect(overallOf([inst(true, 'SIN_DATO'), inst(true, 'SIN_DATO')])).toBe(
      'SIN_DATO',
    );
  });
  it('lista vacía o sin requeridas => SIN_DATO, nunca VIVA', () => {
    expect(overallOf([])).toBe('SIN_DATO');
    expect(overallOf([inst(false, 'VIVA')])).toBe('SIN_DATO');
  });
});

describe('buildLivenessReport', () => {
  const registry: InstanceDefinition[] = [
    { id: 'api', label: 'API', type: 'api', source: 'self', required: true },
    {
      id: 'redis',
      label: 'Redis',
      type: 'service',
      source: 'probe',
      required: true,
    },
    worker,
    { ...worker, id: 'worker-files', required: false },
  ];

  it('U23: forma del contrato completa y con valores del catálogo', () => {
    const report = buildLivenessReport({
      registry,
      heartbeats: store(NOW - 2_000),
      probes: new Map([
        ['redis', { status: 'up', latencyMs: 3, observedAtMs: NOW }],
      ]),
      notMeasured: [{ id: 'minio', reason: 'sin sonda' }],
      nowMs: NOW,
    });
    expect(Object.keys(report).sort()).toEqual(
      [
        'evaluatedAt',
        'instances',
        'notMeasured',
        'overall',
        'thresholds',
      ].sort(),
    );
    expect(report.evaluatedAt).toBe(new Date(NOW).toISOString());
    expect(report.thresholds).toEqual({
      heartbeatIntervalSeconds: 15,
      liveSeconds: 30,
      degradedSeconds: 60,
    });
    expect(report.thresholds).toBe(LIVENESS_THRESHOLDS);
    for (const i of report.instances) {
      expect(Object.keys(i).sort()).toEqual(
        [
          'ageSeconds',
          'cause',
          'evidence',
          'id',
          'lastHeartbeatAt',
          'required',
          'state',
          'thresholdSeconds',
          'type',
        ].sort(),
      );
      expect(['VIVA', 'DEGRADADA', 'CAIDA', 'SIN_DATO']).toContain(i.state);
      expect(['api', 'worker', 'database', 'service']).toContain(i.type);
      expect(typeof i.evidence).toBe('string');
      expect(i.evidence.length).toBeGreaterThan(0);
    }
    // worker-files nunca visto y no requerido: no baja `overall`.
    expect(report.instances.find((i) => i.id === 'worker-files')?.state).toBe(
      'SIN_DATO',
    );
    expect(report.overall).toBe('VIVA');
    expect(report.notMeasured).toEqual([{ id: 'minio', reason: 'sin sonda' }]);
  });

  it('Redis caído: el almacén no disponible deja a los workers SIN_DATO y overall DEGRADADA o peor, nunca VIVA', () => {
    const report = buildLivenessReport({
      registry,
      heartbeats: { available: false, records: new Map() },
      probes: new Map([
        ['redis', { status: 'down', latencyMs: 3000, observedAtMs: NOW }],
      ]),
      notMeasured: [],
      nowMs: NOW,
    });
    expect(
      report.instances.find((i) => i.id === 'worker-messaging')?.state,
    ).toBe('SIN_DATO');
    expect(report.instances.find((i) => i.id === 'redis')?.state).toBe('CAIDA');
    expect(report.overall).toBe('CAIDA');
  });

  it('la API que responde es VIVA tautológica y lo dice', () => {
    const v = evaluateSelfInstance(registry[0], NOW);
    expect(v).toMatchObject({ state: 'VIVA', cause: null, ageSeconds: 0 });
    expect(v.evidence).toMatch(/respondió esta consulta/);
  });

  it('H12: la evidencia nunca incluye mensajes crudos de error ni pid', () => {
    const report = buildLivenessReport({
      registry,
      heartbeats: store(NOW - 90_000, {
        pid: 4242,
        error: 'ECONNREFUSED 10.0.0.5:6379',
      }),
      probes: new Map(),
      notMeasured: [],
      nowMs: NOW,
    });
    const json = JSON.stringify(report);
    expect(json).not.toMatch(/ECONNREFUSED|10\.0\.0\.5|4242/);
  });
});
