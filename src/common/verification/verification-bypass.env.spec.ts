import {
  assertVerificationBypassNotInProduction,
  loadVerificationBypassEnv,
  verificationBypassEnvSchema,
} from './verification-bypass.env';

describe('assertVerificationBypassNotInProduction', () => {
  it('aborta en producción cuando el bypass está activo', () => {
    expect(() =>
      assertVerificationBypassNotInProduction({
        NODE_ENV: 'production',
        DEV_VERIFICATION_BYPASS: 'true',
      }),
    ).toThrow(/DEV_VERIFICATION_BYPASS está activo en producción/);
  });

  it('el mensaje explica el riesgo concreto, no solo que está mal configurado', () => {
    expect(() =>
      assertVerificationBypassNotInProduction({
        NODE_ENV: 'production',
        DEV_VERIFICATION_BYPASS: 'true',
      }),
    ).toThrow(/Guía de profesionales/);
  });

  it('deja arrancar en producción con el flag apagado', () => {
    expect(() =>
      assertVerificationBypassNotInProduction({
        NODE_ENV: 'production',
        DEV_VERIFICATION_BYPASS: 'false',
      }),
    ).not.toThrow();
  });

  it('deja arrancar en producción si la variable no está declarada', () => {
    expect(() =>
      assertVerificationBypassNotInProduction({ NODE_ENV: 'production' }),
    ).not.toThrow();
  });

  it('no interfiere fuera de producción, que es donde el bypass existe para usarse', () => {
    for (const env of ['development', 'test', 'staging', undefined]) {
      expect(() =>
        assertVerificationBypassNotInProduction({
          ...(env ? { NODE_ENV: env } : {}),
          DEV_VERIFICATION_BYPASS: 'true',
        }),
      ).not.toThrow();
    }
  });
});

describe('loadVerificationBypassEnv', () => {
  it('activo solo cuando el flag es exactamente "true"', () => {
    expect(loadVerificationBypassEnv({ DEV_VERIFICATION_BYPASS: 'true' })).toEqual({
      enabled: true,
    });
    expect(loadVerificationBypassEnv({ DEV_VERIFICATION_BYPASS: 'false' })).toEqual(
      { enabled: false },
    );
    expect(loadVerificationBypassEnv({})).toEqual({ enabled: false });
  });
});

describe('verificationBypassEnvSchema', () => {
  // `.when('NODE_ENV', ...)` mira una clave hermana DENTRO del objeto
  // validado, no `process.env` ambiente — igual que hace `ConfigModule.forRoot`,
  // que valida el objeto `process.env` completo de una sola vez. Por eso
  // `NODE_ENV` viaja explícito en cada objeto que se valida acá.

  it('rechaza DEV_VERIFICATION_BYPASS=true en producción', () => {
    const { error } = verificationBypassEnvSchema.validate(
      { NODE_ENV: 'production', DEV_VERIFICATION_BYPASS: 'true' },
      { allowUnknown: true },
    );

    expect(error).toBeDefined();
  });

  it('acepta DEV_VERIFICATION_BYPASS=true fuera de producción', () => {
    const { error, value } = verificationBypassEnvSchema.validate(
      { NODE_ENV: 'development', DEV_VERIFICATION_BYPASS: 'true' },
      { allowUnknown: true },
    ) as { error: unknown; value: Record<string, unknown> };

    expect(error).toBeUndefined();
    expect(value.DEV_VERIFICATION_BYPASS).toBe(true);
  });

  it('por defecto queda apagado en cualquier entorno', () => {
    const { value } = verificationBypassEnvSchema.validate(
      { NODE_ENV: 'development' },
      { allowUnknown: true },
    ) as { value: Record<string, unknown> };

    expect(value.DEV_VERIFICATION_BYPASS).toBe(false);
  });

  it('en producción, sin declarar el flag, queda apagado', () => {
    const { error, value } = verificationBypassEnvSchema.validate(
      { NODE_ENV: 'production' },
      { allowUnknown: true },
    ) as { error: unknown; value: Record<string, unknown> };

    expect(error).toBeUndefined();
    expect(value.DEV_VERIFICATION_BYPASS).toBe(false);
  });
});
