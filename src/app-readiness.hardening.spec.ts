import { jest } from '@jest/globals';
import { AppReadinessService } from './app-readiness.service';
import { SchemaIntegrityState } from './orm/bootstrap/schema-integrity.state';

/** HZ-05 y ORMN-01: sondas de rol de runtime y de integridad del esquema. */
describe('AppReadinessService · endurecimiento', () => {
  const saved = { ...process.env };
  afterEach(() => {
    process.env = { ...saved };
  });

  const build = (
    role: Record<string, unknown> = { rolsuper: false, rolbypassrls: false },
    integrity?: SchemaIntegrityState,
  ) => {
    const execute = jest.fn(async (sql: string) =>
      sql.includes('pg_roles') ? [role] : [{ '?column?': 1 }],
    );
    const ok = { ping: jest.fn(async () => undefined) };
    const service = new AppReadinessService(
      { em: { getConnection: () => ({ execute }) } } as never,
      ok as never,
      ok as never,
      ok as never,
      integrity,
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

    it('SCHEMA_INTEGRITY_ENFORCE=false es la válvula explícita', async () => {
      process.env.SCHEMA_INTEGRITY_ENFORCE = 'false';
      const state = new SchemaIntegrityState();
      state.record(4, 0);
      const { service } = build(undefined, state);
      await expect(service.check()).resolves.toMatchObject({ status: 'ok' });
    });
  });
});
