import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import type { EntityManager } from '@mikro-orm/postgresql';
import type { DocumentStoreService } from '../../../document_store/services';
import type { RedisRuntimeService } from '../../../redis_runtime/services';
import type { SearchIndexService } from '../../../search_platform/services';
import {
  DependencyProbeService,
  PROBE_CACHE_MS,
} from './dependency-probe.service';

function build() {
  const execute = jest.fn<(sql: string) => Promise<unknown>>(async () => []);
  const mongo = jest.fn<() => Promise<void>>(async () => undefined);
  const redis = jest.fn<() => Promise<void>>(async () => undefined);
  const search = jest.fn<() => Promise<void>>(async () => undefined);
  const service = new DependencyProbeService(
    { getConnection: () => ({ execute }) } as unknown as EntityManager,
    { ping: mongo } as unknown as DocumentStoreService,
    { ping: redis } as unknown as RedisRuntimeService,
    { ping: search } as unknown as SearchIndexService,
  );
  return { service, execute, mongo, redis, search };
}

describe('DependencyProbeService', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date('2026-10-30T12:00:00Z') });
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('correcto: las cuatro dependencias arriba', async () => {
    const { service, execute } = build();
    const results = await service.probeAll();
    expect([...results.keys()].sort()).toEqual([
      'mongodb',
      'opensearch',
      'postgresql',
      'redis',
    ]);
    for (const r of results.values()) expect(r.status).toBe('up');
    expect(execute).toHaveBeenCalledWith('select 1');
  });

  it('límite: un segundo llamado dentro de 10 s no vuelve a sondear; pasados 10 s sí', async () => {
    const { service, redis } = build();
    await service.probeAll();
    await service.probeAll();
    expect(redis).toHaveBeenCalledTimes(1);
    jest.setSystemTime(Date.now() + PROBE_CACHE_MS + 1);
    await service.probeAll();
    expect(redis).toHaveBeenCalledTimes(2);
  });

  it('límite: consultas simultáneas comparten una sola ronda de sondas', async () => {
    const { service, mongo } = build();
    await Promise.all([
      service.probeAll(),
      service.probeAll(),
      service.probeAll(),
    ]);
    expect(mongo).toHaveBeenCalledTimes(1);
  });

  it('inválido: una dependencia que falla es down y no contagia a las demás; el mensaje no sale', async () => {
    const { service, mongo } = build();
    mongo.mockRejectedValueOnce(
      new Error('mongodb://user:secret@10.1.1.1 refused'),
    );
    const results = await service.probeAll();
    expect(results.get('mongodb')?.status).toBe('down');
    expect(results.get('redis')?.status).toBe('up');
    expect(JSON.stringify([...results])).not.toMatch(/secret|10\.1\.1\.1/);
  });

  it('inválido: una dependencia colgada se declara down con el plazo completo (3 000 ms)', async () => {
    const { service, search } = build();
    search.mockImplementationOnce(() => new Promise<void>(() => undefined));
    const pending = service.probeAll();
    await jest.advanceTimersByTimeAsync(3_000);
    const results = await pending;
    expect(results.get('opensearch')).toMatchObject({
      status: 'down',
      latencyMs: 3_000,
    });
    expect(results.get('postgresql')?.status).toBe('up');
  });
});
