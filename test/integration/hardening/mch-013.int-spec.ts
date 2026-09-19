import request from 'supertest';
import { bootstrapTestApp, type TestContext } from '../harness';

/**
 * MCH-013 · la readiness no puede anunciar RLS activo si el rol de runtime
 * lo ignora, contra PostgreSQL real.
 *
 * El rol de conexión de este stack local (`mantra`, el propietario de la
 * base) es superusuario y tiene BYPASSRLS — exactamente el caso que
 * `AppReadinessService.checkRls` tiene que rechazar cuando alguien active
 * `RLS_ENFORCE=true` sin definir `DB_APP_USER`. No aplica ninguna política de
 * RLS ni cambia el rol de conexión: sólo lee `pg_roles`.
 */
describe('MCH-013 · readiness no certifica RLS que el rol de runtime ignora (integración)', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  it('con RLS_ENFORCE=false (default), /readiness no evalúa el rol y da ok', async () => {
    delete process.env.RLS_ENFORCE;
    const res = await http().get('/readiness').expect(200);
    expect(res.body.checks.rls).toMatchObject({ status: 'up' });
  });

  it('con RLS_ENFORCE=true y el rol de conexión local (superusuario+BYPASSRLS): 503', async () => {
    process.env.RLS_ENFORCE = 'true';
    try {
      const res = await http().get('/readiness').expect(503);
      expect(res.body.details.checks.rls.status).toBe('down');
    } finally {
      delete process.env.RLS_ENFORCE;
    }
  });
});
