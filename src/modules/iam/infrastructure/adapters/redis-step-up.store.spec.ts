import { jest } from '@jest/globals';
import { StepUpUnavailableError } from '../../application/ports/step-up.port';
import { StepUpStore } from './redis-step-up.store';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const NOW = Date.parse('2026-10-30T12:00:00Z');

/** Fake mínimo de ioredis (set/get/del/ping) con TTL registrado, no ejecutado. */
function fakeRedis() {
  const store = new Map<string, string>();
  const ttl = new Map<string, number>();
  return {
    store,
    ttl,
    set: mockFn(
      async (key: string, value: string, mode: string, sec: number) => {
        expect(mode).toBe('EX');
        store.set(key, value);
        ttl.set(key, sec);
        return 'OK';
      },
    ),
    get: mockFn(async (key: string) => store.get(key) ?? null),
    del: mockFn(async (key: string) => (store.delete(key) ? 1 : 0)),
    ping: mockFn(async () => 'PONG'),
  };
}

const logger = () => ({ setContext: mockFn(), warn: mockFn(), info: mockFn() });

describe('StepUpStore (sello del paso extra en Redis)', () => {
  afterEach(() => {
    jest.useRealTimers();
    delete process.env.SUPPORT_STEP_UP_TTL_MIN;
  });

  it('stamp guarda stepup:<sessionId> = instante con TTL de 60 min por defecto', async () => {
    const redis = fakeRedis();
    const store = new StepUpStore(logger() as any, redis as any);
    const out = await store.stamp('sid-1', NOW);
    expect(redis.store.get('stepup:sid-1')).toBe(String(NOW));
    expect(redis.ttl.get('stepup:sid-1')).toBe(3600);
    expect(out).toEqual({ verifiedAt: new Date(NOW), ttlMinutes: 60 });
  });

  it('respeta SUPPORT_STEP_UP_TTL_MIN y un valor inválido deja los 60', async () => {
    process.env.SUPPORT_STEP_UP_TTL_MIN = '15';
    const redis = fakeRedis();
    const store = new StepUpStore(logger() as any, redis as any);
    expect((await store.stamp('s', NOW)).ttlMinutes).toBe(15);
    expect(redis.ttl.get('stepup:s')).toBe(900);
    process.env.SUPPORT_STEP_UP_TTL_MIN = 'basura';
    expect((await store.stamp('s', NOW)).ttlMinutes).toBe(60);
  });

  it('ageMinutes: null sin sello, edad con sello, 0 si el reloj está desfasado', async () => {
    const redis = fakeRedis();
    const store = new StepUpStore(logger() as any, redis as any);
    await expect(store.ageMinutes('sid-1', NOW)).resolves.toBeNull();
    await store.stamp('sid-1', NOW - 150_000);
    await expect(store.ageMinutes('sid-1', NOW)).resolves.toBe(2.5);
    await store.stamp('sid-2', NOW + 60_000);
    await expect(store.ageMinutes('sid-2', NOW)).resolves.toBe(0);
  });

  it('un valor ilegible en Redis cuenta como sin sello (se vuelve a pedir el paso extra)', async () => {
    const redis = fakeRedis();
    redis.store.set('stepup:sid-1', 'no-es-un-numero');
    const store = new StepUpStore(logger() as any, redis as any);
    await expect(store.ageMinutes('sid-1', NOW)).resolves.toBeNull();
  });

  it('sin sessionId no hay sello', async () => {
    const redis = fakeRedis();
    const store = new StepUpStore(logger() as any, redis as any);
    await expect(store.ageMinutes('', NOW)).resolves.toBeNull();
    expect(redis.get).not.toHaveBeenCalled();
  });

  it('el sello de una sesión no sirve a otra', async () => {
    const redis = fakeRedis();
    const store = new StepUpStore(logger() as any, redis as any);
    await store.stamp('sid-1', NOW);
    await expect(store.ageMinutes('sid-2', NOW)).resolves.toBeNull();
  });

  it('clear borra la clave', async () => {
    const redis = fakeRedis();
    const store = new StepUpStore(logger() as any, redis as any);
    await store.stamp('sid-1', NOW);
    await store.clear('sid-1');
    expect(redis.store.has('stepup:sid-1')).toBe(false);
  });

  describe('Redis caído: falla cerrado (STEP_UP_UNAVAILABLE)', () => {
    it('ageMinutes lanza StepUpUnavailableError, nunca null ni un número', async () => {
      const redis = fakeRedis();
      redis.get = mockFn(async () => {
        throw new Error('ECONNREFUSED');
      });
      const store = new StepUpStore(logger() as any, redis as any);
      await expect(store.ageMinutes('sid-1', NOW)).rejects.toBeInstanceOf(
        StepUpUnavailableError,
      );
    });

    it('stamp lanza StepUpUnavailableError', async () => {
      const redis = fakeRedis();
      redis.set = mockFn(async () => {
        throw new Error('ECONNREFUSED');
      });
      const store = new StepUpStore(logger() as any, redis as any);
      await expect(store.stamp('sid-1', NOW)).rejects.toBeInstanceOf(
        StepUpUnavailableError,
      );
    });

    it('assertAvailable lanza si PING falla', async () => {
      const redis = fakeRedis();
      redis.ping = mockFn(async () => {
        throw new Error('down');
      });
      const store = new StepUpStore(logger() as any, redis as any);
      await expect(store.assertAvailable()).rejects.toBeInstanceOf(
        StepUpUnavailableError,
      );
    });

    it('sin cliente Redis (no configurado) también falla cerrado', async () => {
      const store = new StepUpStore(logger() as any, undefined);
      await expect(store.ageMinutes('sid-1', NOW)).rejects.toBeInstanceOf(
        StepUpUnavailableError,
      );
      await expect(store.stamp('sid-1', NOW)).rejects.toBeInstanceOf(
        StepUpUnavailableError,
      );
      await expect(store.assertAvailable()).rejects.toBeInstanceOf(
        StepUpUnavailableError,
      );
    });

    it('un Redis que no contesta no cuelga la petición: a los 2 s es no disponible', async () => {
      jest.useFakeTimers();
      const redis = fakeRedis();
      redis.get = mockFn(() => new Promise(() => undefined));
      const store = new StepUpStore(logger() as any, redis as any);
      const pending = store.ageMinutes('sid-1', NOW);
      const assertion = expect(pending).rejects.toBeInstanceOf(
        StepUpUnavailableError,
      );
      await jest.advanceTimersByTimeAsync(2_500);
      await assertion;
    });

    it('clear NUNCA lanza (cerrar sesión no puede fallar por Redis) y avisa en el log', async () => {
      const redis = fakeRedis();
      redis.del = mockFn(async () => {
        throw new Error('down');
      });
      const log = logger();
      const store = new StepUpStore(log as any, redis as any);
      await expect(store.clear('sid-1')).resolves.toBeUndefined();
      expect(log.warn).toHaveBeenCalled();
    });

    it('el aviso del log no lleva el sessionId ni datos de la persona', async () => {
      const redis = fakeRedis();
      redis.get = mockFn(async () => {
        throw new Error('ECONNREFUSED');
      });
      const log = logger();
      const store = new StepUpStore(log as any, redis as any);
      await store.ageMinutes('SID-SECRETO', NOW).catch(() => undefined);
      expect(JSON.stringify(log.warn.mock.calls)).not.toContain('SID-SECRETO');
    });
  });
});
