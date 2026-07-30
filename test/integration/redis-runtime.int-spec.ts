import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { bootstrapTestApp, bearer, type TestContext } from './harness';

/**
 * Módulo 56 (Redis Runtime) contra Redis real (`mantra-redesa-redis-1`), no un
 * cliente simulado: valida TTL, borrado, el CAS de los locks distribuidos y el
 * namespacing real por tenant (misma clave, dos tenants, sin colisión).
 */
describe('Redis Runtime (integración, Redis real)', () => {
  let ctx: TestContext;
  const tenantA = randomUUID();
  const tenantB = randomUUID();

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  const http = () => request(ctx.app.getHttpServer());
  const withTenant = (tenantId: string) => ({
    ...bearer(ctx.adminToken),
    'X-Tenant-Id': tenantId,
  });

  it('rechaza operar sin X-Tenant-Id (fail-closed)', async () => {
    await http()
      .post('/redis-runtime/cache')
      .set(bearer(ctx.adminToken))
      .send({ key: 'k1', value: 'v1', ttlSec: 60 })
      .expect(422);
  });

  it('UC-56 escribe y lee un valor de caché con TTL', async () => {
    const key = `k-${Date.now()}`;
    await http()
      .post('/redis-runtime/cache')
      .set(withTenant(tenantA))
      .send({ key, value: 'hola', ttlSec: 60 })
      .expect(200);

    const read = await http()
      .get(`/redis-runtime/cache/${key}`)
      .set(withTenant(tenantA))
      .expect(200);
    expect(read.body).toEqual({ key, found: true, value: 'hola' });
  });

  it('namespacea por tenant: la misma clave en otro tenant no la ve', async () => {
    const key = `k-${Date.now()}`;
    await http()
      .post('/redis-runtime/cache')
      .set(withTenant(tenantA))
      .send({ key, value: 'solo-A', ttlSec: 60 })
      .expect(200);

    const fromB = await http()
      .get(`/redis-runtime/cache/${key}`)
      .set(withTenant(tenantB))
      .expect(200);
    expect(fromB.body).toEqual({ key, found: false, value: null });
  });

  it('UC-56 borra una clave de caché', async () => {
    const key = `k-${Date.now()}`;
    await http()
      .post('/redis-runtime/cache')
      .set(withTenant(tenantA))
      .send({ key, value: 'x', ttlSec: 60 })
      .expect(200);

    await http()
      .delete(`/redis-runtime/cache/${key}`)
      .set(withTenant(tenantA))
      .expect(200)
      .expect((r) => expect(r.body.deleted).toBe(true));

    const read = await http()
      .get(`/redis-runtime/cache/${key}`)
      .set(withTenant(tenantA))
      .expect(200);
    expect(read.body.found).toBe(false);
  });

  it('UC-56 adquiere un lock distribuido real y rechaza una segunda adquisición concurrente', async () => {
    const key = `lock-${Date.now()}`;
    const first = await http()
      .post('/redis-runtime/locks')
      .set(withTenant(tenantA))
      .send({ key, ttlSec: 30 })
      .expect(200);
    expect(first.body.acquired).toBe(true);
    expect(first.body.token).toEqual(expect.any(String));

    // Mismo tenant, mismo key: el SET NX real en Redis ya está tomado.
    const second = await http()
      .post('/redis-runtime/locks')
      .set(withTenant(tenantA))
      .send({ key, ttlSec: 30 })
      .expect(200);
    expect(second.body.acquired).toBe(false);
  });

  it('UC-56 el release con token equivocado no libera el lock (CAS real)', async () => {
    const key = `lock-${Date.now()}`;
    await http()
      .post('/redis-runtime/locks')
      .set(withTenant(tenantA))
      .send({ key, ttlSec: 30 })
      .expect(200);

    const releasedWrong = await http()
      .delete(`/redis-runtime/locks/${key}`)
      .query({ token: 'token-que-no-es' })
      .set(withTenant(tenantA))
      .expect(200);
    expect(releasedWrong.body.released).toBe(false);

    // Sigue tomado: una segunda adquisición todavía falla.
    const stillLocked = await http()
      .post('/redis-runtime/locks')
      .set(withTenant(tenantA))
      .send({ key, ttlSec: 30 })
      .expect(200);
    expect(stillLocked.body.acquired).toBe(false);
  });

  it('UC-56 libera con el token correcto y permite volver a adquirir', async () => {
    const key = `lock-${Date.now()}`;
    const acquired = await http()
      .post('/redis-runtime/locks')
      .set(withTenant(tenantA))
      .send({ key, ttlSec: 30 })
      .expect(200);

    await http()
      .delete(`/redis-runtime/locks/${key}`)
      .query({ token: acquired.body.token })
      .set(withTenant(tenantA))
      .expect(200)
      .expect((r) => expect(r.body.released).toBe(true));

    const reacquired = await http()
      .post('/redis-runtime/locks')
      .set(withTenant(tenantA))
      .send({ key, ttlSec: 30 })
      .expect(200);
    expect(reacquired.body.acquired).toBe(true);
  });
});
