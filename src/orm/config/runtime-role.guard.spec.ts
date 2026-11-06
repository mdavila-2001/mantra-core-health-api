import { jest } from '@jest/globals';
import {
  RuntimeRoleGuardService,
  evaluateRuntimeRole,
  inspectRuntimeRole,
  isRlsEnforcementMissingInProduction,
  shouldVerifyRuntimeRole,
} from './runtime-role.guard';
import { loadOrmEnv } from './orm.env';
import { resolveRuntimeCredentials } from './rls-role-resolution';

const SAFE = { superuser: false, bypassRls: false, ownedUnforcedRlsTables: 0 };
const PROD = { NODE_ENV: 'production' } as NodeJS.ProcessEnv;

describe('evaluateRuntimeRole (HZ-05)', () => {
  it('rol sin privilegios: sin violaciones ni abortar', () => {
    expect(evaluateRuntimeRole(SAFE, PROD)).toEqual({
      violations: [],
      fatal: false,
    });
  });

  it.each([
    ['superusuario', { ...SAFE, superuser: true }],
    ['BYPASSRLS', { ...SAFE, bypassRls: true }],
    [
      'dueño de tablas con RLS sin FORCE',
      { ...SAFE, ownedUnforcedRlsTables: 3 },
    ],
    ['rol irresoluble en pg_roles', null],
  ])('producción + %s: aborta', (_name, facts) => {
    const verdict = evaluateRuntimeRole(facts, PROD);
    expect(verdict.violations.length).toBeGreaterThan(0);
    expect(verdict.fatal).toBe(true);
  });

  it('fuera de producción nunca aborta', () => {
    const verdict = evaluateRuntimeRole(
      { ...SAFE, superuser: true },
      { NODE_ENV: 'development' },
    );
    expect(verdict.violations).toHaveLength(1);
    expect(verdict.fatal).toBe(false);
  });

  it('DB_ALLOW_PRIVILEGED_RUNTIME_ROLE=true es la única excepción en producción', () => {
    const verdict = evaluateRuntimeRole(
      { ...SAFE, superuser: true },
      { ...PROD, DB_ALLOW_PRIVILEGED_RUNTIME_ROLE: 'true' },
    );
    expect(verdict.fatal).toBe(false);
    expect(verdict.violations).toHaveLength(1);
  });
});

describe('shouldVerifyRuntimeRole', () => {
  it('desarrollo y tests no consultan nada', () => {
    expect(shouldVerifyRuntimeRole({ NODE_ENV: 'development' })).toBe(false);
    expect(shouldVerifyRuntimeRole({ NODE_ENV: 'test' })).toBe(false);
    expect(shouldVerifyRuntimeRole({})).toBe(false);
  });
  it('producción o RLS_ENFORCE=true sí', () => {
    expect(shouldVerifyRuntimeRole(PROD)).toBe(true);
    expect(shouldVerifyRuntimeRole({ RLS_ENFORCE: 'true' })).toBe(true);
  });
  it('el proceso de migración/seed queda exento aun en producción', () => {
    expect(
      shouldVerifyRuntimeRole({ ...PROD, DB_ROLE_PURPOSE: 'migration' }),
    ).toBe(false);
  });
});

describe('isRlsEnforcementMissingInProduction (C-3)', () => {
  it.each([
    ['sin definir', {}],
    ['false', { RLS_ENFORCE: 'false' }],
    ['vacío', { RLS_ENFORCE: '' }],
    ['TRUE en mayúsculas', { RLS_ENFORCE: 'TRUE' }],
    ['1', { RLS_ENFORCE: '1' }],
  ])('producción con RLS_ENFORCE %s: falta el aislamiento', (_name, env) => {
    expect(isRlsEnforcementMissingInProduction({ ...PROD, ...env })).toBe(true);
  });
  it('producción con RLS_ENFORCE=true: no falta', () => {
    expect(
      isRlsEnforcementMissingInProduction({ ...PROD, RLS_ENFORCE: 'true' }),
    ).toBe(false);
  });
  it('fuera de producción no se exige', () => {
    expect(
      isRlsEnforcementMissingInProduction({
        NODE_ENV: 'development',
        RLS_ENFORCE: 'false',
      }),
    ).toBe(false);
    expect(isRlsEnforcementMissingInProduction({})).toBe(false);
  });
  it('el proceso de migración/seed queda exento aun en producción', () => {
    expect(
      isRlsEnforcementMissingInProduction({
        ...PROD,
        DB_ROLE_PURPOSE: 'migration',
      }),
    ).toBe(false);
  });
});

describe('inspectRuntimeRole', () => {
  it('mapea la fila de pg_roles y las tablas propias con RLS sin FORCE', async () => {
    const facts = await inspectRuntimeRole(
      async () =>
        [
          {
            rolsuper: false,
            rolbypassrls: true,
            owned_unforced_rls_tables: 7,
          },
        ] as never,
    );
    expect(facts).toEqual({
      superuser: false,
      bypassRls: true,
      ownedUnforcedRlsTables: 7,
    });
  });
  it('sin fila devuelve null', async () => {
    expect(await inspectRuntimeRole(async () => [])).toBeNull();
  });
});

describe('RuntimeRoleGuardService (arranque)', () => {
  const saved = { ...process.env };
  afterEach(() => {
    process.env = { ...saved };
  });

  const build = (row?: Record<string, unknown>) => {
    const execute = jest.fn(async () => (row ? [row] : []));
    const service = new RuntimeRoleGuardService({
      em: { getConnection: () => ({ execute }) },
    } as never);
    return { service, execute };
  };

  it('en desarrollo no toca la base', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.RLS_ENFORCE;
    const { service, execute } = build({ rolsuper: true });
    await service.onApplicationBootstrap();
    expect(execute).not.toHaveBeenCalled();
  });

  it('producción con superusuario: rechaza el arranque con SYSTEM_DB_ROLE_PRIVILEGED', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.DB_ALLOW_PRIVILEGED_RUNTIME_ROLE;
    const { service } = build({ rolsuper: true, rolbypassrls: true });
    await expect(service.onApplicationBootstrap()).rejects.toThrow(
      'SYSTEM_DB_ROLE_PRIVILEGED',
    );
  });

  it('producción con rol de aplicación (sin BYPASSRLS, no dueño): arranca', async () => {
    process.env.NODE_ENV = 'production';
    process.env.RLS_ENFORCE = 'true';
    const { service } = build({
      rolsuper: false,
      rolbypassrls: false,
      owned_unforced_rls_tables: 0,
    });
    await expect(service.onApplicationBootstrap()).resolves.toBeUndefined();
  });

  it('producción con la excepción explícita: arranca', async () => {
    process.env.NODE_ENV = 'production';
    process.env.RLS_ENFORCE = 'true';
    process.env.DB_ALLOW_PRIVILEGED_RUNTIME_ROLE = 'true';
    const { service } = build({ rolsuper: true });
    await expect(service.onApplicationBootstrap()).resolves.toBeUndefined();
  });

  it.each([
    ['sin definir', undefined],
    ['false', 'false'],
  ])(
    'producción con rol de aplicación y RLS_ENFORCE %s: rechaza el arranque con SYSTEM_RLS_ENFORCE_DISABLED',
    async (_name, value) => {
      process.env.NODE_ENV = 'production';
      if (value === undefined) delete process.env.RLS_ENFORCE;
      else process.env.RLS_ENFORCE = value;
      const { service } = build({
        rolsuper: false,
        rolbypassrls: false,
        owned_unforced_rls_tables: 0,
      });
      await expect(service.onApplicationBootstrap()).rejects.toThrow(
        'SYSTEM_RLS_ENFORCE_DISABLED',
      );
    },
  );

  it('producción con la excepción explícita y RLS_ENFORCE=false: la válvula no cubre el interruptor', async () => {
    process.env.NODE_ENV = 'production';
    process.env.RLS_ENFORCE = 'false';
    process.env.DB_ALLOW_PRIVILEGED_RUNTIME_ROLE = 'true';
    const { service } = build({ rolsuper: true });
    await expect(service.onApplicationBootstrap()).rejects.toThrow(
      'SYSTEM_RLS_ENFORCE_DISABLED',
    );
  });

  it('el proceso de migración (seed-cli) no es rechazado con el rol dueño', async () => {
    process.env.NODE_ENV = 'production';
    process.env.DB_ROLE_PURPOSE = 'migration';
    const { service, execute } = build({ rolsuper: true });
    await expect(service.onApplicationBootstrap()).resolves.toBeUndefined();
    expect(execute).not.toHaveBeenCalled();
  });
});

describe('credenciales de migración y de runtime separadas (HZ-05)', () => {
  const base = {
    DB_HOST: 'db.interno',
    DB_PORT: '5432',
    DB_USER: 'dueno',
    DB_PASSWORD: 'clave-dueno-sintetica',
    DB_NAME: 'salud',
  };
  const saved = { ...process.env };
  afterEach(() => {
    process.env = { ...saved };
  });

  it('DB_APP_USER exige DB_APP_PASSWORD', () => {
    expect(() => loadOrmEnv({ ...base, DB_APP_USER: 'mantra_app' })).toThrow(
      'DB_APP_PASSWORD',
    );
    expect(() =>
      loadOrmEnv({
        ...base,
        DB_APP_USER: 'mantra_app',
        DB_APP_PASSWORD: 'clave-app-sintetica',
      }),
    ).not.toThrow();
  });

  it('sin DB_APP_USER (o vacío) el runtime usa el rol dueño, como antes', () => {
    expect(() => loadOrmEnv(base)).not.toThrow();
    expect(() =>
      loadOrmEnv({ ...base, DB_APP_USER: '', DB_APP_PASSWORD: '' }),
    ).not.toThrow();
  });

  it('el runtime conecta con el rol de aplicación y su propia clave', () => {
    expect(
      resolveRuntimeCredentials(
        { user: 'dueno', password: 'clave-dueno-sintetica' },
        { DB_APP_USER: 'mantra_app', DB_APP_PASSWORD: 'clave-app-sintetica' },
      ),
    ).toEqual({ user: 'mantra_app', password: 'clave-app-sintetica' });
  });

  it('un DB_APP_USER vacío (compose de migración) cae al rol dueño', () => {
    expect(
      resolveRuntimeCredentials(
        { user: 'dueno', password: 'clave-dueno-sintetica' },
        { DB_APP_USER: '', DB_APP_PASSWORD: '' },
      ),
    ).toEqual({ user: 'dueno', password: 'clave-dueno-sintetica' });
  });

  it('la migración usa el rol dueño aunque llegue DB_APP_USER (Coolify rellena el vacío)', () => {
    expect(
      resolveRuntimeCredentials(
        { user: 'dueno', password: 'clave-dueno-sintetica' },
        {
          DB_APP_USER: 'mantra_app',
          DB_APP_PASSWORD: 'clave-app-sintetica',
          DB_ROLE_PURPOSE: 'migration',
        },
      ),
    ).toEqual({ user: 'dueno', password: 'clave-dueno-sintetica' });
  });

  it('otro DB_ROLE_PURPOSE no cambia nada: el runtime sigue con el rol de aplicación', () => {
    expect(
      resolveRuntimeCredentials(
        { user: 'dueno', password: 'clave-dueno-sintetica' },
        {
          DB_APP_USER: 'mantra_app',
          DB_APP_PASSWORD: 'clave-app-sintetica',
          DB_ROLE_PURPOSE: 'runtime',
        },
      ),
    ).toEqual({ user: 'mantra_app', password: 'clave-app-sintetica' });
  });
});
