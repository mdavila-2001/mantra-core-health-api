import { describe, it, expect } from '@jest/globals';
import { demoGateSkip, loadDemoGateEnv } from './demo-gate';

const env = (vars: Record<string, string>) =>
  loadDemoGateEnv(vars as NodeJS.ProcessEnv);

describe('demoGateSkip: las cuatro combinaciones de contraseña y permiso', () => {
  it('sin contraseña ni permiso: not-configured', () => {
    expect(demoGateSkip(env({ NODE_ENV: 'production' }))).toBe(
      'not-configured',
    );
  });

  it('con permiso y sin contraseña: not-configured', () => {
    expect(
      demoGateSkip(
        env({ NODE_ENV: 'production', SEED_DEMO_ALLOW_PRODUCTION: 'true' }),
      ),
    ).toBe('not-configured');
  });

  it('con contraseña y sin permiso en producción: production-not-allowed', () => {
    expect(
      demoGateSkip(
        env({ NODE_ENV: 'production', SEED_DEMO_PASSWORD: 'una-clave' }),
      ),
    ).toBe('production-not-allowed');
  });

  it('con contraseña y permiso: puede crear cuentas', () => {
    expect(
      demoGateSkip(
        env({
          NODE_ENV: 'production',
          SEED_DEMO_PASSWORD: 'una-clave',
          SEED_DEMO_ALLOW_PRODUCTION: 'true',
        }),
      ),
    ).toBeUndefined();
  });
});

describe('loadDemoGateEnv', () => {
  it('la contraseña vacía cuenta como ausente', () => {
    expect(env({ SEED_DEMO_PASSWORD: '' }).password).toBeUndefined();
  });

  it('solo el literal "true" autoriza producción', () => {
    expect(env({ SEED_DEMO_ALLOW_PRODUCTION: '1' }).allowProduction).toBe(
      false,
    );
    expect(env({ SEED_DEMO_ALLOW_PRODUCTION: 'true' }).allowProduction).toBe(
      true,
    );
  });

  it('fuera de producción no hace falta el permiso', () => {
    expect(
      demoGateSkip(env({ NODE_ENV: 'development', SEED_DEMO_PASSWORD: 'x' })),
    ).toBeUndefined();
  });
});
