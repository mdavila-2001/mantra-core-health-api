import {
  ALLOWED_HOSTS_VARIABLE,
  DESTRUCTIVE_RESET_FLAG,
  UnsafeResetTargetError,
  assertDisposableResetTarget,
  assertServerIdentity,
  isDisposableDatabaseName,
  resolveResetTarget,
} from './disposable-database';

/** Entorno de un operador que sí autorizó el reset contra una base local. */
const safeEnv = (): NodeJS.ProcessEnv => ({
  [DESTRUCTIVE_RESET_FLAG]: 'yes',
  DB_HOST: '127.0.0.1',
  DB_PORT: '55434',
  DB_NAME: 'mantra_smoke_test',
});

describe('SP-01 — preflight del reset destructivo', () => {
  it('Correcto: bandera, host local y base descartable pasan', () => {
    const env = safeEnv();
    const target = resolveResetTarget(env);
    expect(() => assertDisposableResetTarget(target, env)).not.toThrow();
    expect(() =>
      assertServerIdentity('mantra_smoke_test', target),
    ).not.toThrow();
  });

  it('Límite: un host remoto declarado en la lista permitida pasa', () => {
    const env = {
      ...safeEnv(),
      DB_HOST: 'ci-db.internal',
      [ALLOWED_HOSTS_VARIABLE]: 'otro.host, CI-DB.internal',
    };
    expect(() =>
      assertDisposableResetTarget(resolveResetTarget(env), env),
    ).not.toThrow();
  });

  it('Error: sin bandera se rechaza aunque host y base sean seguros', () => {
    const env = safeEnv();
    delete env[DESTRUCTIVE_RESET_FLAG];
    expect(() =>
      assertDisposableResetTarget(resolveResetTarget(env), env),
    ).toThrow(UnsafeResetTargetError);
    env[DESTRUCTIVE_RESET_FLAG] = 'true';
    expect(() =>
      assertDisposableResetTarget(resolveResetTarget(env), env),
    ).toThrow(/ALLOW_DESTRUCTIVE_DB_RESET=yes/);
  });

  it('Error: un host remoto no declarado se rechaza', () => {
    const env = { ...safeEnv(), DB_HOST: 'shared.neon.tech' };
    expect(() =>
      assertDisposableResetTarget(resolveResetTarget(env), env),
    ).toThrow(/no es local/);
  });

  it('Error: el nombre de base por defecto (de desarrollo) se rechaza', () => {
    const env = safeEnv();
    delete env.DB_NAME;
    expect(resolveResetTarget(env).database).toBe('mantra_redesa_health');
    expect(() =>
      assertDisposableResetTarget(resolveResetTarget(env), env),
    ).toThrow(/no se declara descartable/);
  });

  it.each([
    ['mantra_copays_test', true],
    ['smoke', true],
    ['ci-run-42', true],
    ['alovida', false],
    ['production_latest', false],
    ['contest', false],
    ['mantra_redesa_health', false],
  ])('nombre %s descartable=%s', (name, expected) => {
    expect(isDisposableDatabaseName(name)).toBe(expected);
  });

  it('Falla catalogada: el servidor informa otra base que la configurada', () => {
    const target = resolveResetTarget(safeEnv());
    expect(() => assertServerIdentity('alovida', target)).toThrow(
      UnsafeResetTargetError,
    );
    expect(() => assertServerIdentity('mantra_other_test', target)).toThrow(
      /distinta de la configurada/,
    );
  });

  it('el mensaje de rechazo no expone credenciales', () => {
    const env = {
      ...safeEnv(),
      DB_HOST: 'shared.neon.tech',
      DB_PASSWORD: 's3cr3t-value',
      DB_USER: 'admin',
    };
    try {
      assertDisposableResetTarget(resolveResetTarget(env), env);
      throw new Error('debía rechazar');
    } catch (error) {
      expect((error as Error).message).not.toContain('s3cr3t-value');
    }
  });
});
