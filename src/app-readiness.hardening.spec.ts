import { jest } from '@jest/globals';
import { AppReadinessService } from './app-readiness.service';
import { SchemaIntegrityState } from './orm/bootstrap/schema-integrity.state';
import { catalogConceptDefinitions } from './common/seed/catalog-concept-definitions';
import { SeedCoreState } from './common/seed/seed-core.state';

/**
 * HZ-05, ORMN-01 y SEED-01: sondas de rol de runtime, de integridad del esquema y de
 * seeds núcleo.
 */
describe('AppReadinessService · endurecimiento', () => {
  const saved = { ...process.env };
  afterEach(() => {
    process.env = { ...saved };
  });

  const build = (
    role: Record<string, unknown> = { rolsuper: false, rolbypassrls: false },
    integrity?: SchemaIntegrityState,
    seed?: SeedCoreState,
    conceptsPresent: number = catalogConceptDefinitions().size,
  ) => {
    const execute = jest.fn(async (sql: string) => {
      if (sql.includes('pg_roles')) return [role];
      if (sql.includes('terminology.catalog_concepts'))
        return [{ present: conceptsPresent }];
      return [{ '?column?': 1 }];
    });
    const ok = { ping: jest.fn(async () => undefined) };
    const service = new AppReadinessService(
      { em: { getConnection: () => ({ execute }) } } as never,
      ok as never,
      ok as never,
      ok as never,
      integrity,
      seed,
    );
    return { service, execute };
  };

  describe('rol de runtime en producción sin RLS_ENFORCE (HZ-05)', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      delete process.env.RLS_ENFORCE;
      delete process.env.DB_ALLOW_PRIVILEGED_RUNTIME_ROLE;
    });

    it('superusuario: 503 con la sonda rls caída', async () => {
      const { service } = build({ rolsuper: true, rolbypassrls: true });
      await expect(service.check()).rejects.toMatchObject({
        status: 503,
        response: { details: { checks: { rls: { status: 'down' } } } },
      });
    });

    it('rol de aplicación: ok', async () => {
      const { service } = build();
      const result = await service.check();
      expect(result.checks.rls).toMatchObject({ status: 'up' });
    });

    it('dueño de tablas con RLS sin FORCE: 503', async () => {
      const { service } = build({
        rolsuper: false,
        rolbypassrls: false,
        owned_unforced_rls_tables: 5,
      });
      await expect(service.check()).rejects.toMatchObject({ status: 503 });
    });

    it('la excepción explícita lo tolera mientras RLS_ENFORCE no sea true', async () => {
      process.env.DB_ALLOW_PRIVILEGED_RUNTIME_ROLE = 'true';
      const { service, execute } = build({ rolsuper: true });
      const result = await service.check();
      expect(result.checks.rls).toMatchObject({ status: 'up' });
      expect(execute).toHaveBeenCalledTimes(1);
    });

    it('el proceso de migración no es juzgado por esta sonda', async () => {
      process.env.DB_ROLE_PURPOSE = 'migration';
      const { service } = build({ rolsuper: true });
      await expect(service.check()).resolves.toMatchObject({ status: 'ok' });
    });
  });

  describe('integridad del esquema (ORMN-01)', () => {
    it('sin incidencias: ok', async () => {
      const state = new SchemaIntegrityState();
      state.record(0, 2);
      const { service } = build(undefined, state);
      const result = await service.check();
      expect(result.checks.postgresql).toMatchObject({ status: 'up' });
    });

    it('con una FK o único pendiente: 503 sin detalle de la restricción', async () => {
      const state = new SchemaIntegrityState();
      state.record(1, 0);
      const { service } = build(undefined, state);
      await expect(service.check()).rejects.toMatchObject({
        status: 503,
        response: {
          details: { checks: { postgresql: { status: 'down' } } },
        },
      });
    });

    it('el 503 lleva su reason propio, no el de dependencia caída (ORMN-01)', async () => {
      const state = new SchemaIntegrityState();
      state.record(2, 0);
      const { service } = build(undefined, state);
      await expect(service.check()).rejects.toMatchObject({
        status: 503,
        response: {
          code: 'DEPENDENCY_UNAVAILABLE',
          reason: 'SYSTEM_SCHEMA_INTEGRITY_INCOMPLETE',
        },
      });
    });

    it('SCHEMA_INTEGRITY_ENFORCE=false es la válvula explícita', async () => {
      process.env.SCHEMA_INTEGRITY_ENFORCE = 'false';
      const state = new SchemaIntegrityState();
      state.record(4, 0);
      const { service } = build(undefined, state);
      await expect(service.check()).resolves.toMatchObject({ status: 'ok' });
    });
  });

  describe('seeds núcleo (SEED-01)', () => {
    it('un seed núcleo fallido y tolerado en este proceso: 503 SYSTEM_SEED_CORE_INCOMPLETE', async () => {
      const seed = new SeedCoreState();
      seed.record(['catálogo de conceptos', 'roles asistenciales']);
      const { service } = build(undefined, undefined, seed);
      await expect(service.check()).rejects.toMatchObject({
        status: 503,
        response: {
          code: 'DEPENDENCY_UNAVAILABLE',
          reason: 'SYSTEM_SEED_CORE_INCOMPLETE',
          details: { checks: { postgresql: { status: 'down' } } },
        },
      });
    });

    it('el cuerpo público no nombra los pasos fallidos', async () => {
      const seed = new SeedCoreState();
      seed.record(['roles asistenciales']);
      const { service } = build(undefined, undefined, seed);
      const error = await service.check().then(
        () => undefined,
        (e: unknown) => e,
      );
      expect(JSON.stringify(error)).not.toContain('roles asistenciales');
    });

    it('con otra dependencia caída además, el reason es el genérico', async () => {
      const seed = new SeedCoreState();
      seed.record(['roles asistenciales']);
      const ok = { ping: jest.fn(async () => undefined) };
      const redisCaido = {
        ping: jest.fn(async () => {
          throw new Error('connect ECONNREFUSED');
        }),
      };
      const service = new AppReadinessService(
        {
          em: {
            getConnection: () => ({ execute: jest.fn(async () => [{}]) }),
          },
        } as never,
        ok as never,
        redisCaido as never,
        ok as never,
        undefined,
        seed,
      );
      await expect(service.check()).rejects.toMatchObject({
        response: { reason: 'SYSTEM_READINESS_DEPENDENCY_UNAVAILABLE' },
      });
    });

    it('sin pasos fallidos: ok', async () => {
      const seed = new SeedCoreState();
      seed.record([]);
      const { service } = build(undefined, undefined, seed);
      await expect(service.check()).resolves.toMatchObject({ status: 'ok' });
    });

    it('con la siembra al arranque encendida no consulta el catálogo', async () => {
      delete process.env.SEED_ON_BOOT;
      const { service, execute } = build(undefined, undefined, undefined, 0);
      await expect(service.check()).resolves.toMatchObject({ status: 'ok' });
      expect(
        execute.mock.calls.some(([sql]) =>
          sql.includes('terminology.catalog_concepts'),
        ),
      ).toBe(false);
    });

    describe('SEED_ON_BOOT=false: la sonda mira la base', () => {
      beforeEach(() => {
        process.env.SEED_ON_BOOT = 'false';
      });

      it('catálogo completo: ok, y no se vuelve a consultar', async () => {
        const { service, execute } = build();
        await service.check();
        await service.check();
        const consultas = execute.mock.calls.filter(([sql]) =>
          sql.includes('terminology.catalog_concepts'),
        );
        expect(consultas).toHaveLength(1);
        // Un placeholder por concepto del seed, sin interpolar ningún id en el SQL.
        expect(consultas[0][0]).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/);
      });

      it('faltan conceptos: 503 SYSTEM_SEED_CORE_INCOMPLETE y se reintenta en la siguiente', async () => {
        const total = catalogConceptDefinitions().size;
        const { service, execute } = build(
          undefined,
          undefined,
          undefined,
          total - 3,
        );
        await expect(service.check()).rejects.toMatchObject({
          status: 503,
          response: { reason: 'SYSTEM_SEED_CORE_INCOMPLETE' },
        });
        await expect(service.check()).rejects.toMatchObject({ status: 503 });
        const consultas = execute.mock.calls.filter(([sql]) =>
          sql.includes('terminology.catalog_concepts'),
        );
        expect(consultas).toHaveLength(2);
      });

      it('si el esquema y el catálogo fallan a la vez, publica el de la primera comprobación (el esquema)', async () => {
        const state = new SchemaIntegrityState();
        state.record(1, 0);
        const { service } = build(undefined, state, undefined, 1);
        // Las dos viven en la sonda de postgresql: la primera que falla corta.
        await expect(service.check()).rejects.toMatchObject({
          response: { reason: 'SYSTEM_SCHEMA_INTEGRITY_INCOMPLETE' },
        });
      });
    });
  });
});
