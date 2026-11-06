import { afterEach, describe, expect, it, jest } from '@jest/globals';
import type { AppReadinessService } from '../../../app-readiness.service';
import { loadInstanceLivenessEnv } from '../domain/instance-liveness.env';
import type { InstanceHeartbeatRepository } from '../infrastructure/repositories/instance-heartbeat.repository';
import {
  INSTANCE_UNKNOWN_REASON,
  InstanceLivenessService,
  PROBE_CACHE_TTL_MS,
} from './instance-liveness.service';

type Collect = AppReadinessService['collect'];

function build(
  over: {
    readAll?: InstanceHeartbeatRepository['readAll'];
    collect?: Collect;
  } = {},
) {
  const save = jest.fn<InstanceHeartbeatRepository['save']>(
    async () => undefined,
  );
  const readAll =
    over.readAll ??
    jest.fn<InstanceHeartbeatRepository['readAll']>(async () => ({}));
  const collect =
    over.collect ??
    jest.fn<Collect>(async () => [
      ['postgresql', { status: 'up', latencyMs: 10 }],
      ['mongodb', { status: 'up', latencyMs: 10 }],
      ['redis', { status: 'up', latencyMs: 2 }],
      ['opensearch', { status: 'up', latencyMs: 30 }],
      ['rls', { status: 'up', latencyMs: 1 }],
    ]);
  const service = new InstanceLivenessService(
    { save, readAll } as unknown as InstanceHeartbeatRepository,
    { collect } as unknown as AppReadinessService,
    loadInstanceLivenessEnv({}, 3_000),
  );
  return { service, save, readAll, collect };
}

const byId = (
  response: Awaited<ReturnType<InstanceLivenessService['liveness']>>,
  id: string,
) => response.instances.find((instance) => instance.id === id)!;

describe('InstanceLivenessService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('guarda el latido con receivedAt del reloj de la API y lo confirma en ISO', async () => {
    const { service, save } = build();
    const now = Date.parse('2026-10-30T12:05:15.000Z');
    const body = {
      instanceId: 'worker-messaging',
      pid: 41,
      startedAt: '2026-10-30T12:00:00.000Z',
      sentAt: '2026-10-30T12:05:14.000Z',
      status: 'running',
      liveness: { healthy: true, reasons: [] },
      readiness: { healthy: true, reasons: [] },
      stuckTicks: 0,
      openCircuits: [],
    };
    await expect(service.recordHeartbeat(body, now)).resolves.toEqual({
      instanceId: 'worker-messaging',
      receivedAt: '2026-10-30T12:05:15.000Z',
    });
    expect(save).toHaveBeenCalledWith({ ...body, receivedAt: now });
  });

  it('rechaza con 422 INSTANCE_UNKNOWN una instancia fuera del registro, sin guardar', async () => {
    const { service, save } = build();
    await expect(
      service.recordHeartbeat({
        instanceId: 'worker-inventado',
        pid: 1,
        startedAt: '',
        sentAt: '',
        status: 'running',
        liveness: { healthy: true, reasons: [] },
        readiness: { healthy: true, reasons: [] },
        stuckTicks: 0,
        openCircuits: [],
      }),
    ).rejects.toMatchObject({
      status: 422,
      reason: INSTANCE_UNKNOWN_REASON,
    });
    expect(save).not.toHaveBeenCalled();
  });

  it('con Redis caído y su sonda vencida: store down, workers SIN_DATO, redis CAIDA / PROBE_TIMEOUT y overall CRITICO', async () => {
    const error = new Error('connect ECONNREFUSED 10.0.0.9:6379');
    error.name = 'RedisConnectionError';
    const { service } = build({
      readAll: jest.fn<InstanceHeartbeatRepository['readAll']>(async () => {
        throw error;
      }),
      collect: jest.fn<Collect>(async () => [
        ['postgresql', { status: 'up', latencyMs: 10 }],
        ['mongodb', { status: 'up', latencyMs: 10 }],
        [
          'redis',
          { status: 'down', latencyMs: 3_000, errorType: 'ProbeTimeoutError' },
        ],
        ['opensearch', { status: 'up', latencyMs: 30 }],
        ['rls', { status: 'up', latencyMs: 1 }],
      ]),
    });

    const response = await service.liveness();

    expect(response.heartbeatStore).toEqual({
      status: 'down',
      reason: 'STORE_UNAVAILABLE',
    });
    expect(byId(response, 'redis')).toMatchObject({
      state: 'CAIDA',
      cause: 'PROBE_TIMEOUT',
    });
    for (const worker of response.instances.filter(
      (i) => i.type === 'WORKER',
    )) {
      expect(worker).toMatchObject({
        state: 'SIN_DATO',
        cause: 'STORE_UNAVAILABLE',
      });
    }
    expect(response.overall).toBe('CRITICO');
    expect(JSON.stringify(response)).not.toContain('ECONNREFUSED');
  });

  it('cachea las sondas 10 s y una sola corrida atiende a las consultas concurrentes', async () => {
    const { service, collect } = build();
    let now = Date.parse('2026-10-30T12:05:20.000Z');
    jest.spyOn(Date, 'now').mockImplementation(() => now);

    await Promise.all([service.liveness(), service.liveness()]);
    expect(collect).toHaveBeenCalledTimes(1);

    now += PROBE_CACHE_TTL_MS - 1;
    await service.liveness();
    expect(collect).toHaveBeenCalledTimes(1);

    now += 1;
    await service.liveness();
    expect(collect).toHaveBeenCalledTimes(2);
  });

  it('si la corrida de sondas falla, las dependencias quedan NOT_PROBED en vez de heredar el resultado anterior', async () => {
    const { service } = build({
      collect: jest.fn<Collect>(async () => {
        throw new Error('pool exhausted at host db-1');
      }),
    });
    const response = await service.liveness();
    expect(byId(response, 'postgresql')).toMatchObject({
      state: 'SIN_DATO',
      cause: 'NOT_PROBED',
    });
    expect(JSON.stringify(response)).not.toContain('db-1');
  });

  it('la API que responde es VIVA con source self y su arranque', async () => {
    const { service } = build();
    const response = await service.liveness();
    expect(byId(response, 'api')).toMatchObject({
      state: 'VIVA',
      evidence: { source: 'self', reportedStatus: 'running' },
    });
    expect(
      Date.parse(byId(response, 'api').evidence.startedAt!),
    ).toBeLessThanOrEqual(Date.now());
  });
});
