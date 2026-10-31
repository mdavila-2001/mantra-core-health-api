import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type {
  HeartbeatStoreRead,
  ProbeResult,
  StoredHeartbeat,
} from '../domain/instance-liveness';
import { INSTANCE_REGISTRY } from '../domain/instance-registry';
import { resolveRegistry } from '../domain/instance-liveness.env';
import { OpsInstancesService } from './ops-instances.service';
import type { DependencyProbeService } from '../infrastructure/probes/dependency-probe.service';
import type { InstanceHeartbeatRepository } from '../infrastructure/repositories/instance-heartbeat.repository';

const NOW = new Date('2026-10-30T12:05:20.000Z');

function allProbesUp(): Map<string, ProbeResult> {
  return new Map(
    ['postgresql', 'mongodb', 'redis', 'opensearch'].map((id) => [
      id,
      { status: 'up', latencyMs: 5, observedAtMs: NOW.getTime() - 1000 },
    ]),
  );
}

function build(read: HeartbeatStoreRead, probes = allProbesUp()) {
  const record = jest.fn<(hb: StoredHeartbeat) => Promise<void>>(
    async () => undefined,
  );
  const heartbeats = {
    record,
    readAll: jest.fn(async () => read),
  } as unknown as InstanceHeartbeatRepository;
  const probe = {
    probeAll: jest.fn(async () => probes),
  } as unknown as DependencyProbeService;
  const service = new OpsInstancesService(
    resolveRegistry({ requiredWorkers: null }),
    heartbeats,
    probe,
  );
  return { service, record };
}

const rawFor = (id: string, receivedAt: number) =>
  JSON.stringify({ instanceId: id, type: 'worker', receivedAt });

describe('OpsInstancesService.liveness', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: NOW });
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('todos los requeridos con latido fresco y sondas arriba => overall VIVA', async () => {
    const records = new Map(
      INSTANCE_REGISTRY.filter((i) => i.type === 'worker').map((w) => [
        w.id,
        rawFor(w.id, NOW.getTime() - 3_000),
      ]),
    );
    const { service } = build({ available: true, records });
    const report = await service.liveness();
    expect(report.overall).toBe('VIVA');
    expect(report.instances.filter((i) => i.type === 'worker')).toHaveLength(
      25,
    );
    expect(report.notMeasured.map((n) => n.id)).toEqual(
      expect.arrayContaining(['minio', 'clamav', 'mock-provider-server']),
    );
  });

  it('límite: workers nunca vistos => SIN_DATO / NEVER_SEEN y overall no VIVA', async () => {
    const { service } = build({ available: true, records: new Map() });
    const report = await service.liveness();
    const w = report.instances.find((i) => i.id === 'worker-messaging');
    expect(w).toMatchObject({ state: 'SIN_DATO', cause: 'NEVER_SEEN' });
    expect(report.overall).not.toBe('VIVA');
  });

  it('inválido: almacén caído => workers SIN_DATO / STORE_UNAVAILABLE y no lanza', async () => {
    const { service } = build({ available: false, records: new Map() });
    const report = await service.liveness();
    expect(
      report.instances.find((i) => i.id === 'worker-billing'),
    ).toMatchObject({
      state: 'SIN_DATO',
      cause: 'STORE_UNAVAILABLE',
    });
  });
});

describe('OpsInstancesService.recordHeartbeat', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: NOW });
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('correcto: guarda con el reloj del servidor', async () => {
    const { service, record } = build({ available: true, records: new Map() });
    await service.recordHeartbeat({
      instanceId: 'worker-messaging',
      type: 'worker',
      version: '1.2.3',
    });
    expect(record).toHaveBeenCalledWith({
      instanceId: 'worker-messaging',
      type: 'worker',
      version: '1.2.3',
      receivedAt: NOW.getTime(),
    });
  });

  it('inválido: instanceId fuera del registro => 422 INSTANCE_UNKNOWN y no guarda', async () => {
    const { service, record } = build({ available: true, records: new Map() });
    await expect(
      service.recordHeartbeat({
        instanceId: 'worker-inventado',
        type: 'worker',
      }),
    ).rejects.toMatchObject({
      constructor: UnprocessableEntityException,
      response: { reason: 'INSTANCE_UNKNOWN' },
    });
    expect(record).not.toHaveBeenCalled();
  });

  it.each([
    [
      'una base de datos no emite latidos',
      { instanceId: 'postgresql', type: 'database' as const },
    ],
    ['la API no emite latidos', { instanceId: 'api', type: 'api' as const }],
    [
      'tipo que no coincide con el registro',
      { instanceId: 'worker-messaging', type: 'service' as const },
    ],
  ])('inválido: %s => 422 y no guarda', async (_n, input) => {
    const { service, record } = build({ available: true, records: new Map() });
    await expect(service.recordHeartbeat(input)).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
    expect(record).not.toHaveBeenCalled();
  });

  it('inválido: Redis falla al guardar => 503 sin filtrar el error', async () => {
    const { service, record } = build({ available: true, records: new Map() });
    record.mockRejectedValueOnce(new Error('ECONNREFUSED 10.0.0.5'));
    const error = await service
      .recordHeartbeat({ instanceId: 'worker-messaging', type: 'worker' })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ServiceUnavailableException);
    expect(
      JSON.stringify((error as ServiceUnavailableException).getResponse()),
    ).not.toMatch(/ECONNREFUSED|10\.0\.0\.5/);
  });
});
