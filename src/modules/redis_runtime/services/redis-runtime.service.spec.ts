import { jest } from '@jest/globals';
import { RedisRuntimeService } from './redis-runtime.service';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/**
 * Fake mínimo de ioredis con un almacén en memoria. Cubre los comandos que usa
 * el servicio (set/get/del/incr/expire/ttl/eval) sin depender de Redis real.
 */
function makeFakeRedis() {
  const store = new Map<string, string>();
  return {
    store,
    set: mockFn(async (key: string, value: string, ...args: any[]) => {
      const hasNx = args.includes('NX');
      if (hasNx && store.has(key)) {
        return null;
      }
      store.set(key, value);
      return 'OK';
    }),
    get: mockFn(async (key: string) =>
      store.has(key) ? store.get(key)! : null,
    ),
    del: mockFn(async (key: string) => (store.delete(key) ? 1 : 0)),
    incr: mockFn(async (key: string) => {
      const next = Number(store.get(key) ?? '0') + 1;
      store.set(key, String(next));
      return next;
    }),
    expire: mockFn(async () => 1),
    ttl: mockFn(async () => 60),
    eval: mockFn(
      async (_script: string, _numKeys: number, key: string, token: string) => {
        if (store.get(key) === token) {
          store.delete(key);
          return 1;
        }
        return 0;
      },
    ),
  };
}

const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

/**
 * Ejecuta la operación make service.
 * @returns Resultado de make service.
 */
function makeService() {
  const redis = makeFakeRedis();
  const service = new RedisRuntimeService(redis as any, logger as any);
  return { redis, service };
}

const TENANT = 'tenant-a';

describe('RedisRuntimeService', () => {
  it('namespacea las claves de caché por tenant', async () => {
    const { redis, service } = makeService();
    await service.setWithTtl(TENANT, 'k1', 'v1', 30);
    expect(redis.set).toHaveBeenCalledWith('tenant-a:cache:k1', 'v1', 'EX', 30);
    expect(await service.get(TENANT, 'k1')).toBe('v1');
  });

  it('aísla tenants: un tenant no lee la clave de otro', async () => {
    const { service } = makeService();
    await service.setWithTtl('tenant-a', 'k', 'secreto-a', 30);
    expect(await service.get('tenant-b', 'k')).toBeNull();
  });

  it('del devuelve true si la clave existía y false si no', async () => {
    const { service } = makeService();
    await service.setWithTtl(TENANT, 'k', 'v', 30);
    expect(await service.del(TENANT, 'k')).toBe(true);
    expect(await service.del(TENANT, 'k')).toBe(false);
  });

  it('incrWithWindow fija TTL sólo en el primer incremento', async () => {
    const { redis, service } = makeService();
    const first = await service.incrWithWindow(TENANT, 'rate', 60);
    expect(first.count).toBe(1);
    expect(redis.expire).toHaveBeenCalledTimes(1);
    const second = await service.incrWithWindow(TENANT, 'rate', 60);
    expect(second.count).toBe(2);
    expect(redis.expire).toHaveBeenCalledTimes(1);
  });

  it('acquireLock usa NX y falla si ya está tomado; releaseLock respeta el token (CAS)', async () => {
    const { service } = makeService();
    const first = await service.acquireLock(TENANT, 'res', 30);
    expect(first.acquired).toBe(true);
    expect(first.token).toBeDefined();

    const second = await service.acquireLock(TENANT, 'res', 30);
    expect(second.acquired).toBe(false);

    // Token equivocado no libera.
    expect(await service.releaseLock(TENANT, 'res', 'token-malo')).toBe(false);
    // Token correcto sí.
    expect(await service.releaseLock(TENANT, 'res', first.token!)).toBe(true);
    // Tras liberar, se puede volver a adquirir.
    expect((await service.acquireLock(TENANT, 'res', 30)).acquired).toBe(true);
  });

  it('putChallenge no guarda el secreto en claro y verifyChallenge lo consume al acertar', async () => {
    const { redis, service } = makeService();
    await service.putChallenge(TENANT, 'otp:user1', '123456', 300);
    expect(redis.store.get('tenant-a:challenge:otp:user1')).not.toBe('123456');

    expect(await service.verifyChallenge(TENANT, 'otp:user1', '000000')).toBe(
      false,
    );
    // El fallo no consume el challenge (sigue disponible).
    expect(await service.verifyChallenge(TENANT, 'otp:user1', '123456')).toBe(
      true,
    );
    // El acierto sí lo consume (single-use).
    expect(await service.verifyChallenge(TENANT, 'otp:user1', '123456')).toBe(
      false,
    );
  });

  it('verifyChallenge devuelve false si el challenge no existe/expiró', async () => {
    const { service } = makeService();
    expect(await service.verifyChallenge(TENANT, 'inexistente', 'x')).toBe(
      false,
    );
  });
});
