import { jest } from '@jest/globals';
import { SupportPatientProbeCounter } from './support-patient-probe-counter';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const T0 = Date.UTC(2026, 9, 30, 12, 0, 0, 0);
const MINUTE = 60 * 1000;

/**
 * Redis de juguete con la parte que usa el contador: `MULTI` con `INCR`,
 * `PEXPIRE` y `GET`, ejecutado de una sola vez (como hace Redis: sin que otro
 * comando se cuele entre medias).
 */
function fakeRedis() {
  const store = new Map<string, number>();
  const ttl = new Map<string, number>();
  const redis = {
    multi: () => {
      const ops: Array<() => unknown> = [];
      const chain: any = {
        incr: (key: string) => {
          ops.push(() => {
            store.set(key, (store.get(key) ?? 0) + 1);
            return store.get(key);
          });
          return chain;
        },
        pexpire: (key: string, ms: number) => {
          ops.push(() => {
            ttl.set(key, ms);
            return 1;
          });
          return chain;
        },
        get: (key: string) => {
          ops.push(() => (store.has(key) ? String(store.get(key)) : null));
          return chain;
        },
        exec: async () => ops.map((op) => [null, op()]),
      };
      return chain;
    },
  };
  return { redis, store, ttl };
}

const ENV_KEYS = [
  'SUPPORT_PATIENT_SEARCH_PER_MINUTE',
  'SUPPORT_PATIENT_SEARCH_PER_DAY',
  'SUPPORT_PATIENT_SEARCH_IP_PER_MINUTE',
  'SUPPORT_PATIENT_SEARCH_IP_PER_DAY',
];
const savedEnv: Record<string, string | undefined> = {};
beforeEach(() => {
  for (const key of ENV_KEYS) {
    savedEnv[key] = process.env[key];
    delete process.env[key];
  }
});
afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
});

function build(
  options: { redis?: unknown | null; env?: Record<string, string> } = {},
) {
  Object.assign(process.env, options.env ?? {});
  const logger = { setContext: mockFn(), warn: mockFn(), info: mockFn() };
  const fake = fakeRedis();
  const redis =
    options.redis === null ? undefined : (options.redis ?? fake.redis);
  const counter = new SupportPatientProbeCounter(logger as any, redis as any);
  return { counter, logger, ...fake };
}

describe('SupportPatientProbeCounter (N4)', () => {
  it('admite 20 intentos por minuto de una persona y rechaza el 21', async () => {
    const d = build();
    for (let i = 1; i <= 20; i += 1) {
      const verdict = await d.counter.hit('user-ana', '10.0.0.1', T0);
      expect(verdict.allowed).toBe(true);
    }
    const blocked = await d.counter.hit('user-ana', '10.0.0.1', T0);
    expect(blocked).toMatchObject({
      allowed: false,
      exceeded: { scope: 'PERSON', window: 'MINUTE' },
    });
  });

  it('cuenta TODO intento, también el rechazado: el contador sigue subiendo', async () => {
    const d = build();
    for (let i = 0; i < 25; i += 1) {
      await d.counter.hit('user-ana', undefined, T0);
    }
    const minuteKey = [...d.store.keys()].find(
      (k) => k.includes('person') && k.includes('minute'),
    )!;
    expect(d.store.get(minuteKey)).toBe(25);
  });

  it('la clave es por persona, sin organización: cambiar de organización no reinicia el cupo', async () => {
    const d = build();
    await d.counter.hit('user-ana', '10.0.0.1', T0);
    const keys = [...d.store.keys()];
    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) {
      expect(key).not.toMatch(/tenant|org/i);
    }
    // `hit` ni siquiera recibe una organización: 20 intentos «en la A» y 1 «en la B»
    // son 21 de la misma persona.
    const e = build();
    for (let i = 0; i < 20; i += 1)
      await e.counter.hit('user-ana', undefined, T0);
    expect((await e.counter.hit('user-ana', undefined, T0)).allowed).toBe(
      false,
    );
  });

  it('peticiones en paralelo no ven el mismo contador: de 30 simultáneas pasan exactamente 20', async () => {
    const d = build();
    const verdicts = await Promise.all(
      Array.from({ length: 30 }, () =>
        d.counter.hit('user-ana', undefined, T0),
      ),
    );
    expect(verdicts.filter((v) => v.allowed)).toHaveLength(20);
    expect(verdicts.filter((v) => !v.allowed)).toHaveLength(10);
  });

  it('el tope diario (200) rige aunque cada minuto esté por debajo del suyo', async () => {
    const d = build();
    for (let i = 0; i < 200; i += 1) {
      // Un intento cada 4 s: 15 por minuto, nunca el tope por minuto.
      const verdict = await d.counter.hit('user-ana', undefined, T0 + i * 4000);
      expect(verdict.allowed).toBe(true);
    }
    const blocked = await d.counter.hit('user-ana', undefined, T0 + 200 * 4000);
    expect(blocked).toMatchObject({
      allowed: false,
      exceeded: { scope: 'PERSON', window: 'DAY' },
    });
  });

  it('el tope por IP rige para varias cuentas desde el mismo origen', async () => {
    const d = build();
    // 4 cuentas x 15 intentos = 60 desde una IP: ninguna pasa su propio tope.
    for (let i = 0; i < 60; i += 1) {
      const verdict = await d.counter.hit(`user-${i % 4}`, '203.0.113.9', T0);
      expect(verdict.allowed).toBe(true);
    }
    const blocked = await d.counter.hit('user-5', '203.0.113.9', T0);
    expect(blocked).toMatchObject({
      allowed: false,
      exceeded: { scope: 'IP', window: 'MINUTE' },
    });
    // Otra IP no se ve afectada.
    expect((await d.counter.hit('user-5', '203.0.113.10', T0)).allowed).toBe(
      true,
    );
  });

  it('los topes salen del entorno', async () => {
    const d = build({
      env: {
        SUPPORT_PATIENT_SEARCH_PER_MINUTE: '3',
        SUPPORT_PATIENT_SEARCH_IP_PER_MINUTE: '5',
      },
    });
    for (let i = 0; i < 3; i += 1) await d.counter.hit('u', '1.1.1.1', T0);
    expect((await d.counter.hit('u', '1.1.1.1', T0)).allowed).toBe(false);
    for (let i = 0; i < 2; i += 1) await d.counter.hit('v', '2.2.2.2', T0);
    for (let i = 0; i < 2; i += 1) await d.counter.hit('w', '2.2.2.2', T0);
    for (let i = 0; i < 1; i += 1) await d.counter.hit('x', '2.2.2.2', T0);
    const ipBlocked = await d.counter.hit('y', '2.2.2.2', T0);
    expect(ipBlocked.exceeded).toEqual({ scope: 'IP', window: 'MINUTE' });
  });

  it('sin IP conocida cuenta solo por persona', async () => {
    const d = build();
    await d.counter.hit('user-ana', undefined, T0);
    expect([...d.store.keys()].every((k) => !k.includes(':ip:'))).toBe(true);
  });

  it('solo el primer rechazo de una racha pide sello (no se inunda la cadena de auditoría)', async () => {
    const d = build();
    for (let i = 0; i < 20; i += 1)
      await d.counter.hit('user-ana', undefined, T0);
    const first = await d.counter.hit('user-ana', undefined, T0);
    const second = await d.counter.hit('user-ana', undefined, T0);
    expect(first).toMatchObject({ allowed: false, firstOverflow: true });
    expect(second).toMatchObject({ allowed: false, firstOverflow: false });
  });

  describe('alarma al 80%', () => {
    it('no avisa por debajo y avisa al llegar al 80% del tope por minuto', async () => {
      const d = build();
      for (let i = 0; i < 15; i += 1)
        await d.counter.hit('user-ana', undefined, T0);
      expect(d.logger.warn).not.toHaveBeenCalled();
      await d.counter.hit('user-ana', undefined, T0);
      expect(d.logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'delegated_access.support_patient_probe.anomaly',
          userId: 'user-ana',
          scope: 'PERSON',
          window: 'MINUTE',
        }),
        expect.any(String),
      );
      // Un aviso por ventana, no uno por intento.
      for (let i = 0; i < 4; i += 1)
        await d.counter.hit('user-ana', undefined, T0);
      expect(d.logger.warn).toHaveBeenCalledTimes(1);
    });

    it('también avisa por IP', async () => {
      const d = build({ env: { SUPPORT_PATIENT_SEARCH_IP_PER_MINUTE: '10' } });
      for (let i = 0; i < 8; i += 1) {
        await d.counter.hit(`user-${i}`, '198.51.100.7', T0);
      }
      expect(d.logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ scope: 'IP', window: 'MINUTE' }),
        expect.any(String),
      );
    });
  });

  it('ventana deslizante: 20 intentos al final de un minuto no dan otros 20 al empezar el siguiente', async () => {
    const d = build();
    const endOfMinute = T0 + MINUTE - 100;
    for (let i = 0; i < 20; i += 1) {
      expect(
        (await d.counter.hit('user-ana', undefined, endOfMinute)).allowed,
      ).toBe(true);
    }
    const next = T0 + MINUTE + 100;
    // Apenas cambió el reloj: lo del minuto anterior todavía pesa casi entero.
    expect((await d.counter.hit('user-ana', undefined, next)).allowed).toBe(
      true,
    );
    expect((await d.counter.hit('user-ana', undefined, next)).allowed).toBe(
      false,
    );
    // Pasado un minuto completo, el cupo vuelve.
    expect(
      (await d.counter.hit('user-ana', undefined, T0 + 3 * MINUTE)).allowed,
    ).toBe(true);
  });

  it('las claves vencen (no quedan contadores eternos en Redis)', async () => {
    const d = build();
    await d.counter.hit('user-ana', '10.0.0.1', T0);
    expect(d.ttl.size).toBeGreaterThan(0);
    for (const ms of d.ttl.values()) expect(ms).toBeGreaterThan(0);
  });

  describe('si Redis no responde', () => {
    it('degrada a memoria del proceso y sigue limitando, avisando una sola vez', async () => {
      const broken = {
        multi: () => {
          const chain: any = {
            incr: () => chain,
            pexpire: () => chain,
            get: () => chain,
            exec: async () => {
              throw new Error('ECONNREFUSED');
            },
          };
          return chain;
        },
      };
      const d = build({ redis: broken });
      for (let i = 0; i < 20; i += 1) {
        expect((await d.counter.hit('user-ana', undefined, T0)).allowed).toBe(
          true,
        );
      }
      expect((await d.counter.hit('user-ana', undefined, T0)).allowed).toBe(
        false,
      );
      const degraded = d.logger.warn.mock.calls.filter(([, msg]: any[]) =>
        String(msg).includes('Redis'),
      );
      expect(degraded).toHaveLength(1);
    });

    it('una respuesta con error en algún comando del MULTI también degrada', async () => {
      const partial = {
        multi: () => {
          const chain: any = {
            incr: () => chain,
            pexpire: () => chain,
            get: () => chain,
            exec: async () => [[new Error('OOM'), null]],
          };
          return chain;
        },
      };
      const d = build({ redis: partial });
      expect((await d.counter.hit('user-ana', undefined, T0)).allowed).toBe(
        true,
      );
    });
  });

  it('sin cliente Redis (pruebas, generador OpenAPI) usa memoria del proceso', async () => {
    const d = build({ redis: null });
    for (let i = 0; i < 20; i += 1)
      await d.counter.hit('user-ana', undefined, T0);
    expect((await d.counter.hit('user-ana', undefined, T0)).allowed).toBe(
      false,
    );
  });
});
