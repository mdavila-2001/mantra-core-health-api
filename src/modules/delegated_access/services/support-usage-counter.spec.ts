import { jest } from '@jest/globals';
import Redis from 'ioredis';
import { SupportUsageCounter } from './support-usage-counter';
import type { UsageKey } from '../domain';

const logger = { setContext: () => undefined, warn: () => undefined } as any;
const NOW = new Date('2026-11-03T14:30:00Z');
const TENANT = 'tenant-hospital';

const actions = (over: Partial<UsageKey> = {}): UsageKey => ({
  metric: 'ACTIONS',
  per: 'DAY',
  period: '2026-11-03',
  scope: 'GRANT',
  subject: 'grant-ana',
  bucket: 'agenda.appointment.cancel',
  ...over,
});

/** Mismas pruebas para la memoria del proceso y para Redis real (si hay). */
function suite(
  name: string,
  make: () => { counter: SupportUsageCounter; done: () => Promise<void> },
) {
  describe(name, () => {
    it('cuenta acciones del día y respeta el tope (peek no consume)', async () => {
      const { counter, done } = make();
      const key = actions();
      expect(
        (await counter.peek(TENANT, [{ key, max: 2 }], NOW)).get(
          SupportUsageCounter.serialize(key),
        ),
      ).toMatchObject({ used: 0, remaining: 2 });
      expect(
        await counter.consume(TENANT, [{ key, amount: 1, max: 2 }], NOW),
      ).toEqual({ ok: true });
      expect(
        await counter.consume(TENANT, [{ key, amount: 1, max: 2 }], NOW),
      ).toEqual({ ok: true });
      const third = await counter.consume(
        TENANT,
        [{ key, amount: 1, max: 2 }],
        NOW,
      );
      expect(third.ok).toBe(false);
      expect(third.exceeded).toEqual(key);
      const after = await counter.peek(TENANT, [{ key, max: 2 }], NOW);
      expect(after.get(SupportUsageCounter.serialize(key))).toMatchObject({
        used: 2,
        remaining: 0,
      });
      await counter.peek(TENANT, [{ key, max: 2 }], NOW);
      expect(
        (await counter.peek(TENANT, [{ key, max: 2 }], NOW)).get(
          SupportUsageCounter.serialize(key),
        )?.used,
      ).toBe(2);
      await done();
    });

    it('el día siguiente es otro periodo y las concesiones no comparten cupo (scope GRANT)', async () => {
      const { counter, done } = make();
      const today = actions();
      const tomorrow = actions({ period: '2026-11-04' });
      const other = actions({ subject: 'grant-otra' });
      await counter.consume(TENANT, [{ key: today, amount: 1, max: 1 }], NOW);
      expect(
        (
          await counter.consume(
            TENANT,
            [{ key: today, amount: 1, max: 1 }],
            NOW,
          )
        ).ok,
      ).toBe(false);
      expect(
        (
          await counter.consume(
            TENANT,
            [{ key: tomorrow, amount: 1, max: 1 }],
            NOW,
          )
        ).ok,
      ).toBe(true);
      expect(
        (
          await counter.consume(
            TENANT,
            [{ key: other, amount: 1, max: 1 }],
            NOW,
          )
        ).ok,
      ).toBe(true);
      await done();
    });

    it('todo o nada: si un consumo se pasa del tope, ninguno se escribe', async () => {
      const { counter, done } = make();
      const a = actions({ bucket: 'a' });
      const b = actions({ bucket: 'b' });
      await counter.consume(TENANT, [{ key: b, amount: 1, max: 1 }], NOW);
      const result = await counter.consume(
        TENANT,
        [
          { key: a, amount: 1, max: 5 },
          { key: b, amount: 1, max: 1 },
        ],
        NOW,
      );
      expect(result.ok).toBe(false);
      expect(
        (await counter.peek(TENANT, [{ key: a, max: 5 }], NOW)).get(
          SupportUsageCounter.serialize(a),
        )?.used,
      ).toBe(0);
      await done();
    });

    it('ventana deslizante de una hora: lo viejo sale de la cuenta', async () => {
      const { counter, done } = make();
      const key = actions({ per: 'HOUR', period: 'sliding-60m' });
      await counter.consume(
        TENANT,
        [{ key, amount: 1, max: 1 }],
        new Date('2026-11-03T13:00:00Z'),
      );
      expect(
        (
          await counter.consume(
            TENANT,
            [{ key, amount: 1, max: 1 }],
            new Date('2026-11-03T13:30:00Z'),
          )
        ).ok,
      ).toBe(false);
      expect(
        (
          await counter.consume(
            TENANT,
            [{ key, amount: 1, max: 1 }],
            new Date('2026-11-03T14:01:00Z'),
          )
        ).ok,
      ).toBe(true);
      await done();
    });

    it('pacientes distintos: repetir al mismo paciente no gasta cupo', async () => {
      const { counter, done } = make();
      const base = actions({
        metric: 'DISTINCT_PATIENTS',
        bucket: 'patients.search.exact',
      });
      const p1 = { ...base, patientProfileId: 'pac-1' };
      const p2 = { ...base, patientProfileId: 'pac-2' };
      expect(
        (await counter.consume(TENANT, [{ key: p1, amount: 1, max: 1 }], NOW))
          .ok,
      ).toBe(true);
      expect(
        (await counter.consume(TENANT, [{ key: p1, amount: 1, max: 1 }], NOW))
          .ok,
      ).toBe(true);
      expect(
        (await counter.consume(TENANT, [{ key: p2, amount: 1, max: 1 }], NOW))
          .ok,
      ).toBe(false);
      const read = await counter.peek(
        TENANT,
        [
          { key: p1, max: 1 },
          { key: p2, max: 1 },
        ],
        NOW,
      );
      expect(read.get(SupportUsageCounter.serialize(p1))).toMatchObject({
        used: 1,
        alreadyCounted: true,
      });
      expect(read.get(SupportUsageCounter.serialize(p2))).toMatchObject({
        used: 1,
      });
      expect(
        read.get(SupportUsageCounter.serialize(p2))?.alreadyCounted,
      ).toBeUndefined();
      await done();
    });

    it('montos del día: suma en unidades menores y rechaza al pasar el tope', async () => {
      const { counter, done } = make();
      const key = actions({
        metric: 'AMOUNT',
        bucket: 'billing.payment.collect',
      });
      expect(
        (
          await counter.consume(
            TENANT,
            [{ key, amount: 150_000, max: 500_000 }],
            NOW,
          )
        ).ok,
      ).toBe(true);
      expect(
        (
          await counter.consume(
            TENANT,
            [{ key, amount: 300_000, max: 500_000 }],
            NOW,
          )
        ).ok,
      ).toBe(true);
      expect(
        (
          await counter.consume(
            TENANT,
            [{ key, amount: 100_000, max: 500_000 }],
            NOW,
          )
        ).ok,
      ).toBe(false);
      expect(
        (await counter.peek(TENANT, [{ key, max: 500_000 }], NOW)).get(
          SupportUsageCounter.serialize(key),
        )?.used,
      ).toBe(450_000);
      await done();
    });

    it('concurrencia: 10 consumos simultáneos al último cupo, entra uno', async () => {
      const { counter, done } = make();
      const key = actions({ bucket: 'carrera' });
      const results = await Promise.all(
        Array.from({ length: 10 }, () =>
          counter.consume(TENANT, [{ key, amount: 1, max: 1 }], NOW),
        ),
      );
      expect(results.filter((r) => r.ok)).toHaveLength(1);
      await done();
    });
  });
}

suite('SupportUsageCounter en memoria (sin Redis)', () => ({
  counter: new SupportUsageCounter(logger),
  done: async () => undefined,
}));

describe('SupportUsageCounter con Redis caído', () => {
  it('degrada a memoria con aviso y NO abre el tope', async () => {
    const warn = (jest.fn as any)();
    const broken = {
      get: () => Promise.reject(new Error('ECONNREFUSED')),
      eval: () => Promise.reject(new Error('ECONNREFUSED')),
    } as any;
    const counter = new SupportUsageCounter(
      { setContext: () => undefined, warn } as any,
      broken,
    );
    const key = actions();
    expect(
      (await counter.consume(TENANT, [{ key, amount: 1, max: 1 }], NOW)).ok,
    ).toBe(true);
    expect(
      (await counter.consume(TENANT, [{ key, amount: 1, max: 1 }], NOW)).ok,
    ).toBe(false);
    const read = await counter.peek(TENANT, [{ key, max: 1 }], NOW);
    expect(read.get(SupportUsageCounter.serialize(key))).toMatchObject({
      used: 1,
      remaining: 0,
    });
    expect(warn).toHaveBeenCalledTimes(1);
  });
});

const port = Number(process.env.B3B_REDIS_PORT ?? 0);
if (port > 0) {
  let n = 0;
  suite('SupportUsageCounter con Redis real (script Lua atómico)', () => {
    const redis = new Redis({ port, host: '127.0.0.1', lazyConnect: false });
    // Cada prueba usa su propia organización para no mezclar contadores.
    const tenantSalt = `t${Date.now()}-${n++}`;
    const base = new SupportUsageCounter(logger, redis as any);
    const counter = new Proxy(base, {
      get: (target, prop) =>
        prop === 'peek'
          ? (_t: string, ...rest: unknown[]) =>
              (target.peek as any)(tenantSalt, ...rest)
          : prop === 'consume'
            ? (_t: string, ...rest: unknown[]) =>
                (target.consume as any)(tenantSalt, ...rest)
            : (target as any)[prop],
    });
    return {
      counter,
      done: async () => {
        redis.disconnect();
      },
    };
  });
}
