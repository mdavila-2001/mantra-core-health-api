import {
  ALLOWED_HOSTS_VARIABLE,
  DESTRUCTIVE_RESET_FLAG,
  PERMANENT_RESIDUE_FLAG,
  UnsafeResetTargetError,
  assertDisposableResetTarget,
  assertPermanentResidueTarget,
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

describe('Residuo permanente — preflight de pruebas que escriben historial de sólo inserción (#827)', () => {
  const env = (extra: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv => ({
    DB_HOST: '127.0.0.1',
    DB_PORT: '55434',
    DB_NAME: 'mantra_lane16_test',
    ...extra,
  });

  it('Correcto: host local y base descartable por nombre pasan sin bandera', () => {
    const e = env();
    expect(() =>
      assertPermanentResidueTarget(resolveResetTarget(e), e),
    ).not.toThrow();
  });

  it('Error: la base de desarrollo compartida (nombre por defecto) se rechaza', () => {
    const e = env({ DB_NAME: 'mantra_redesa_health' });
    expect(() =>
      assertPermanentResidueTarget(resolveResetTarget(e), e),
    ).toThrow(UnsafeResetTargetError);
    expect(() =>
      assertPermanentResidueTarget(resolveResetTarget(e), e),
    ).toThrow(/historial de sólo inserción/);
  });

  it('Error: sin DB_NAME cae en el nombre por defecto y se rechaza', () => {
    const e = env();
    delete e.DB_NAME;
    expect(() =>
      assertPermanentResidueTarget(resolveResetTarget(e), e),
    ).toThrow(/no se declara descartable/);
  });

  it('Límite: la bandera explícita habilita una base no descartable por nombre (CI)', () => {
    const e = env({
      DB_NAME: 'mantra_redesa_health',
      [PERMANENT_RESIDUE_FLAG]: 'yes',
    });
    expect(() =>
      assertPermanentResidueTarget(resolveResetTarget(e), e),
    ).not.toThrow();
  });

  it('Error: cualquier valor de la bandera distinto de yes se rechaza', () => {
    const e = env({
      DB_NAME: 'mantra_redesa_health',
      [PERMANENT_RESIDUE_FLAG]: 'true',
    });
    expect(() =>
      assertPermanentResidueTarget(resolveResetTarget(e), e),
    ).toThrow(UnsafeResetTargetError);
  });

  it('Error: un host remoto no declarado se rechaza aunque la bandera esté puesta', () => {
    const e = env({
      DB_HOST: 'shared.neon.tech',
      [PERMANENT_RESIDUE_FLAG]: 'yes',
    });
    expect(() =>
      assertPermanentResidueTarget(resolveResetTarget(e), e),
    ).toThrow(/no es local/);
  });

  it('Límite: un host remoto declarado en la lista permitida pasa', () => {
    const e = env({
      DB_HOST: 'ci-db.internal',
      [ALLOWED_HOSTS_VARIABLE]: 'ci-db.internal',
    });
    expect(() =>
      assertPermanentResidueTarget(resolveResetTarget(e), e),
    ).not.toThrow();
  });

  it('No filtra credenciales en el mensaje', () => {
    const e = env({
      DB_NAME: 'mantra_redesa_health',
      DB_PASSWORD: 's3cr3t-value',
    });
    try {
      assertPermanentResidueTarget(resolveResetTarget(e), e);
    } catch (error) {
      expect((error as Error).message).not.toContain('s3cr3t-value');
    }
  });
});
