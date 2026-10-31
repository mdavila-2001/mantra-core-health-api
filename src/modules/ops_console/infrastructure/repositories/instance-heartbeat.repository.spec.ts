import { describe, expect, it, jest } from '@jest/globals';
import type { PinoLogger } from 'nestjs-pino';
import type { RedisClient } from '../../../redis_runtime/redis.provider';
import { RedisRuntimeService } from '../../../redis_runtime/services';
import {
  HEARTBEAT_HASH_KEY,
  HEARTBEAT_HASH_TTL_SECONDS,
  InstanceHeartbeatRepository,
} from './instance-heartbeat.repository';

/**
 * Doble de Redis (BLOQUEADO: no hay Redis real en esta máquina). Cubre el
 * contrato que el repositorio consume: HSET / EXPIRE / HGETALL.
 */
function fakeRedis() {
  const hashes = new Map<string, Map<string, string>>();
  const expires: [string, number][] = [];
  const redis = {
    hset: jest.fn(async (key: string, field: string, value: string) => {
      const hash = hashes.get(key) ?? new Map<string, string>();
      hash.set(field, value);
      hashes.set(key, hash);
      return 1;
    }),
    expire: jest.fn(async (key: string, seconds: number) => {
      expires.push([key, seconds]);
      return 1;
    }),
    hgetall: jest.fn(async (key: string) =>
      Object.fromEntries(hashes.get(key) ?? []),
    ),
  };
  return { redis, hashes, expires, client: redis as unknown as RedisClient };
}

describe('InstanceHeartbeatRepository (doble de Redis)', () => {
  it('correcto: guarda el latido en el hash con TTL de 7 días sobre la clave contenedora', async () => {
    const { client, hashes, expires } = fakeRedis();
    const repo = new InstanceHeartbeatRepository(client);

    await repo.record({
      instanceId: 'worker-messaging',
      type: 'worker',
      receivedAt: 1700,
    });

    expect(
      JSON.parse(hashes.get(HEARTBEAT_HASH_KEY)!.get('worker-messaging')!),
    ).toEqual({
      instanceId: 'worker-messaging',
      type: 'worker',
      receivedAt: 1700,
    });
    expect(expires).toEqual([[HEARTBEAT_HASH_KEY, HEARTBEAT_HASH_TTL_SECONDS]]);
    expect(HEARTBEAT_HASH_TTL_SECONDS).toBe(604_800);
  });

  it('límite (H2): repetirlo sobrescribe, no duplica', async () => {
    const { client, hashes } = fakeRedis();
    const repo = new InstanceHeartbeatRepository(client);
    await repo.record({
      instanceId: 'worker-billing',
      type: 'worker',
      receivedAt: 1,
    });
    await repo.record({
      instanceId: 'worker-billing',
      type: 'worker',
      receivedAt: 2,
    });
    const hash = hashes.get(HEARTBEAT_HASH_KEY)!;
    expect(hash.size).toBe(1);
    expect(JSON.parse(hash.get('worker-billing')!).receivedAt).toBe(2);
  });

  it('readAll devuelve todos los registros como crudos', async () => {
    const { client } = fakeRedis();
    const repo = new InstanceHeartbeatRepository(client);
    await repo.record({
      instanceId: 'worker-a',
      type: 'worker',
      receivedAt: 1,
    });
    await repo.record({
      instanceId: 'worker-b',
      type: 'worker',
      receivedAt: 2,
    });
    const read = await repo.readAll();
    expect(read.available).toBe(true);
    expect([...read.records.keys()].sort()).toEqual(['worker-a', 'worker-b']);
  });

  it('límite: clave inexistente => disponible y vacío (nunca vista, no caída)', async () => {
    const read = await new InstanceHeartbeatRepository(
      fakeRedis().client,
    ).readAll();
    expect(read).toEqual({ available: true, records: new Map() });
  });

  it('inválido (U17): Redis lanza => available:false, sin propagar el error ni su mensaje', async () => {
    const { redis, client } = fakeRedis();
    redis.hgetall.mockRejectedValueOnce(
      new Error('ECONNREFUSED 10.0.0.5:6379') as never,
    );
    const read = await new InstanceHeartbeatRepository(client).readAll();
    expect(read.available).toBe(false);
    expect(read.records.size).toBe(0);
  });

  it('inválido: Redis que no responde dentro del plazo => available:false', async () => {
    const { redis, client } = fakeRedis();
    redis.hgetall.mockImplementationOnce(
      () => new Promise(() => undefined) as never,
    );
    const read = await new InstanceHeartbeatRepository(client).readAll(20);
    expect(read.available).toBe(false);
  });

  it('inválido: record propaga el fallo de Redis para que la ingesta responda 503', async () => {
    const { redis, client } = fakeRedis();
    redis.hset.mockRejectedValueOnce(new Error('boom') as never);
    await expect(
      new InstanceHeartbeatRepository(client).record({
        instanceId: 'worker-a',
        type: 'worker',
        receivedAt: 1,
      }),
    ).rejects.toThrow('boom');
  });
});

describe('H11: el latido no es falsificable vía RedisRuntimeService (/redis-runtime/*)', () => {
  it('ninguna clave que RedisRuntimeService pueda formar coincide con la del latido', async () => {
    const keys: string[] = [];
    const record = async (key: string) => {
      keys.push(key);
      return 'OK';
    };
    const redis = {
      set: jest.fn(record),
      get: jest.fn(async (k: string) => (keys.push(k), null)),
      del: jest.fn(async (k: string) => (keys.push(k), 0)),
      incr: jest.fn(async (k: string) => (keys.push(k), 1)),
      expire: jest.fn(async () => 1),
      eval: jest.fn(
        async (_s: string, _n: number, ...a: string[]) => (keys.push(...a), 1),
      ),
      multi: jest.fn(() => ({
        incr: (k: string) => (keys.push(k), undefined),
        pexpire: () => undefined,
        exec: async () => [],
      })),
    } as unknown as RedisClient;
    const service = new RedisRuntimeService(redis, {
      setContext: () => undefined,
    } as unknown as PinoLogger);

    // Un operador con el tenant más hostil posible: el que parece el prefijo.
    const attempt = async (fn: () => Promise<unknown>) => {
      try {
        await fn();
      } catch {
        // Un tenant vacío se rechaza: no emite clave alguna.
      }
    };
    for (const tenant of ['ops', 'ops:heartbeat', 'ops:heartbeat:v1', '']) {
      await attempt(() =>
        service.setWithTtl(
          tenant,
          'heartbeat:v1',
          '{"receivedAt":9999999999999}',
          60,
        ),
      );
      await attempt(() => service.get(tenant, 'v1'));
      await attempt(() => service.del(tenant, 'heartbeat:v1'));
    }

    expect(keys.length).toBeGreaterThan(0);
    expect(keys).not.toContain(HEARTBEAT_HASH_KEY);
    // Toda clave de ese servicio lleva uno de los cuatro `kind`; la nuestra no.
    for (const key of keys) {
      expect(key).toMatch(/^.*:(cache|counter|lock|challenge):/);
    }
    expect(HEARTBEAT_HASH_KEY).not.toMatch(/:(cache|counter|lock|challenge):/);
  });
});
