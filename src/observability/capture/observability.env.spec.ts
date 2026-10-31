import { loadObservabilityEnv } from './observability.env';

describe('loadObservabilityEnv', () => {
  it('queda apagada por defecto, con 30 s y 2000 ms', () => {
    const env = loadObservabilityEnv({ NODE_ENV: 'production' });
    expect(env).toEqual({
      enabled: false,
      flushSeconds: 30,
      slowRequestMs: 2000,
      actorHashSecret: null,
    });
  });

  it.each(['yes', '1', 'TRUE'])('rechaza OBSERVABILITY_ENABLED="%s"', (raw) => {
    expect(() => loadObservabilityEnv({ OBSERVABILITY_ENABLED: raw })).toThrow(
      /OBSERVABILITY_ENABLED/,
    );
  });

  it.each(['14', '3601', '30.5', 'abc'])(
    'rechaza OBSERVABILITY_FLUSH_SECONDS="%s" (fuera de 15–3600 o no entero)',
    (raw) => {
      expect(() =>
        loadObservabilityEnv({ OBSERVABILITY_FLUSH_SECONDS: raw }),
      ).toThrow(/OBSERVABILITY_FLUSH_SECONDS/);
    },
  );

  it('acepta los límites 15 y 3600', () => {
    expect(
      loadObservabilityEnv({ OBSERVABILITY_FLUSH_SECONDS: '15' }).flushSeconds,
    ).toBe(15);
    expect(
      loadObservabilityEnv({ OBSERVABILITY_FLUSH_SECONDS: '3600' })
        .flushSeconds,
    ).toBe(3600);
  });

  it.each(['49', '600001', 'x'])(
    'rechaza OBSERVABILITY_SLOW_REQUEST_MS="%s"',
    (raw) => {
      expect(() =>
        loadObservabilityEnv({ OBSERVABILITY_SLOW_REQUEST_MS: raw }),
      ).toThrow(/OBSERVABILITY_SLOW_REQUEST_MS/);
    },
  );

  describe('secreto del actor (fail-closed como telemetry-idempotency.env)', () => {
    it.each(['development', 'test'])(
      'en %s hay un secreto por defecto',
      (nodeEnv) => {
        expect(
          loadObservabilityEnv({ NODE_ENV: nodeEnv }).actorHashSecret,
        ).toEqual(expect.any(String));
      },
    );

    it.each([undefined, 'production', 'staging'])(
      'con NODE_ENV=%s y sin secreto propio NO hay secreto (no se guarda actor_hash)',
      (nodeEnv) => {
        expect(
          loadObservabilityEnv({ NODE_ENV: nodeEnv }).actorHashSecret,
        ).toBeNull();
      },
    );

    it('usa el secreto propio si llega y rechaza uno corto', () => {
      const secret = 'a'.repeat(32);
      expect(
        loadObservabilityEnv({
          NODE_ENV: 'production',
          OBSERVABILITY_ACTOR_HASH_SECRET: secret,
        }).actorHashSecret,
      ).toBe(secret);
      expect(() =>
        loadObservabilityEnv({ OBSERVABILITY_ACTOR_HASH_SECRET: 'corto' }),
      ).toThrow(/OBSERVABILITY_ACTOR_HASH_SECRET/);
    });
  });
});
