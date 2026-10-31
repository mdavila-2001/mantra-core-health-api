import { randomUUID } from 'node:crypto';
import Redis from 'ioredis';
import { StepUpUnavailableError } from '../../src/modules/iam/application/ports/step-up.port';
import { IamStepUpService } from '../../src/modules/iam/application/services/iam-step-up.service';
import { StepUpStore } from '../../src/modules/iam/infrastructure/adapters/redis-step-up.store';

/**
 * Paso extra (B5) contra Redis REAL: el sello `stepup:<sessionId>` con su TTL, el
 * vencimiento de verdad, el aislamiento por sesión y el fallo cerrado cuando
 * Redis no está (conexión rechazada y conexión cerrada a mitad de camino).
 *
 * No necesita PostgreSQL: el segundo factor se sustituye por un doble de
 * `IamTotpService` (su verificación ya tiene pruebas propias); lo que se prueba
 * aquí es el almacenamiento y el puerto. Usa `REDIS_HOST` / `REDIS_PORT` como el
 * resto del runtime (por defecto `localhost:6380`).
 */
const HOST = process.env.REDIS_HOST ?? 'localhost';
const PORT = Number(process.env.REDIS_PORT ?? 6380);

const logger = {
  setContext: () => undefined,
  warn: () => undefined,
  info: () => undefined,
} as never;

function client(port = PORT): Redis {
  return new Redis({
    host: HOST,
    port,
    password: process.env.REDIS_PASSWORD || undefined,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null,
  });
}

describe('Paso extra (integración, Redis real)', () => {
  let redis: Redis;
  let store: StepUpStore;
  const sessions: string[] = [];
  const newSid = (): string => {
    const sid = `it-${randomUUID()}`;
    sessions.push(sid);
    return sid;
  };

  beforeAll(async () => {
    redis = client();
    await redis.connect();
    store = new StepUpStore(logger, redis);
  });

  afterAll(async () => {
    if (redis.status === 'ready') {
      await redis.del(...sessions.map((s) => `stepup:${s}`));
      await redis.quit();
    }
    delete process.env.SUPPORT_STEP_UP_TTL_MIN;
  });

  it('stamp escribe stepup:<sid> = instante con TTL de 60 min', async () => {
    const sid = newSid();
    const at = Date.now();
    const out = await store.stamp(sid, at);
    expect(out).toEqual({ verifiedAt: new Date(at), ttlMinutes: 60 });
    expect(await redis.get(`stepup:${sid}`)).toBe(String(at));
    const ttl = await redis.ttl(`stepup:${sid}`);
    expect(ttl).toBeGreaterThan(3590);
    expect(ttl).toBeLessThanOrEqual(3600);
  });

  it('ageMinutes lee la edad real y null en otra sesión', async () => {
    const sid = newSid();
    await store.stamp(sid, Date.now() - 150_000);
    const age = await store.ageMinutes(sid);
    expect(age).not.toBeNull();
    expect(age as number).toBeGreaterThanOrEqual(2.5);
    expect(age as number).toBeLessThan(2.6);
    await expect(store.ageMinutes(newSid())).resolves.toBeNull();
  });

  it('SUPPORT_STEP_UP_TTL_MIN acorta la vida del sello en Redis', async () => {
    process.env.SUPPORT_STEP_UP_TTL_MIN = '1';
    const sid = newSid();
    await store.stamp(sid);
    expect(await redis.ttl(`stepup:${sid}`)).toBeLessThanOrEqual(60);
    delete process.env.SUPPORT_STEP_UP_TTL_MIN;
  });

  it('el sello vence de verdad cuando Redis lo expira', async () => {
    const sid = newSid();
    await store.stamp(sid);
    await redis.pexpire(`stepup:${sid}`, 150);
    await expect(store.ageMinutes(sid)).resolves.not.toBeNull();
    await new Promise((resolve) => setTimeout(resolve, 400));
    await expect(store.ageMinutes(sid)).resolves.toBeNull();
  });

  it('clear borra el sello', async () => {
    const sid = newSid();
    await store.stamp(sid);
    await store.clear(sid);
    expect(await redis.exists(`stepup:${sid}`)).toBe(0);
    await expect(store.ageMinutes(sid)).resolves.toBeNull();
  });

  it('un valor ilegible en la clave se trata como sin sello', async () => {
    const sid = newSid();
    await redis.set(`stepup:${sid}`, 'basura', 'EX', 60);
    await expect(store.ageMinutes(sid)).resolves.toBeNull();
  });

  describe('flujo completo con el servicio y el puerto', () => {
    const actor = (sid: string): never =>
      ({ id: 'u1', sessionId: sid, roles: [] }) as never;

    function service(valid: boolean): IamStepUpService {
      const em = { fork: () => ({ flush: async () => undefined }) };
      const mfaRepo = {
        findVerifiedByUser: async () => [{ id: 'f1', secretEncrypted: 'x' }],
      };
      const totp = { consume: async () => ({ valid }) };
      const eventsRepo = {
        record: () => undefined,
        countFailedMfaSince: async () => 0,
      };
      const usersRepo = { findById: async () => ({ lastLoginAt: new Date() }) };
      return new IamStepUpService(
        em as never,
        mfaRepo as never,
        totp as never,
        eventsRepo as never,
        usersRepo as never,
        store,
        logger,
      );
    }

    it('verify sella, el puerto ve la edad, status dice fresco y otra sesión no', async () => {
      const sid = newSid();
      const res = await service(true).verify(actor(sid), { code: '123456' });
      expect(res.validForMinutes).toBe(60);
      const age = await store.ageMinutes(sid);
      expect(age as number).toBeLessThan(0.1);
      await expect(service(true).status(actor(sid))).resolves.toMatchObject({
        fresh: true,
      });
      await expect(service(true).status(actor(newSid()))).resolves.toEqual({
        fresh: false,
        ageMinutes: null,
      });
    });

    it('un código inválido no deja sello', async () => {
      const sid = newSid();
      await expect(
        service(false).verify(actor(sid), { code: '000000' }),
      ).rejects.toMatchObject({ reason: 'MFA_CODE_INVALID' });
      expect(await redis.exists(`stepup:${sid}`)).toBe(0);
    });
  });

  describe('Redis no disponible: falla cerrado', () => {
    it('con la conexión rechazada, lectura, escritura y PING lanzan StepUpUnavailableError', async () => {
      const dead = client(PORT === 6499 ? 6498 : 6499);
      const deadStore = new StepUpStore(logger, dead);
      await expect(deadStore.ageMinutes('s')).rejects.toBeInstanceOf(
        StepUpUnavailableError,
      );
      await expect(deadStore.stamp('s')).rejects.toBeInstanceOf(
        StepUpUnavailableError,
      );
      await expect(deadStore.assertAvailable()).rejects.toBeInstanceOf(
        StepUpUnavailableError,
      );
      dead.disconnect();
    });

    it('con la conexión cerrada a mitad de camino, el servicio responde 503 STEP_UP_UNAVAILABLE y no sella', async () => {
      const mid = client();
      await mid.connect();
      const midStore = new StepUpStore(logger, mid);
      await midStore.stamp('mid-sid');
      mid.disconnect();
      await expect(midStore.ageMinutes('mid-sid')).rejects.toBeInstanceOf(
        StepUpUnavailableError,
      );
      const svc = new IamStepUpService(
        { fork: () => ({}) } as never,
        {
          findVerifiedByUser: async () => [{ id: 'f1', secretEncrypted: 'x' }],
        } as never,
        {
          consume: () => {
            throw new Error('no debe gastar el código');
          },
        } as never,
        {
          record: () => undefined,
          countFailedMfaSince: async () => 0,
        } as never,
        { findById: async () => ({}) } as never,
        midStore,
        logger,
      );
      await expect(
        svc.verify({ id: 'u1', sessionId: 'mid-sid', roles: [] } as never, {
          code: '123456',
        }),
      ).rejects.toMatchObject({ status: 503, reason: 'STEP_UP_UNAVAILABLE' });
      await redis.del('stepup:mid-sid');
    });

    it('sin cliente Redis configurado también falla cerrado', async () => {
      const none = new StepUpStore(logger, undefined);
      await expect(none.ageMinutes('s')).rejects.toBeInstanceOf(
        StepUpUnavailableError,
      );
    });
  });
});
