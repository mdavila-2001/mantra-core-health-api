import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { bootstrapTestApp, bearer, type TestContext } from './harness';

/**
 * Módulo 57 (Search Platform) contra OpenSearch real (`mantra-redesa-opensearch-1`):
 * valida indexado (`refresh: true`, así que el hit es inmediato), búsqueda de
 * texto, filtros/facetas contra la whitelist del índice, borrado, y que el
 * `tenantId` lo sella el servidor desde el contexto (nunca el cuerpo).
 */
describe('Search Platform (integración, OpenSearch real)', () => {
  let ctx: TestContext;
  const tenantA = randomUUID();
  const tenantB = randomUUID();
  const index = 'directory_profiles';

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
      .post(`/search/${index}/documents`)
      .set(bearer(ctx.adminToken))
      .send({ id: 'doc-1', document: { displayName: 'x' } })
      .expect(422);
  });

  it('UC-57 indexa y encuentra el documento por texto (refresh inmediato)', async () => {
    const id = `prof-${Date.now()}`;
    await http()
      .post(`/search/${index}/documents`)
      .set(withTenant(tenantA))
      .send({
        id,
        document: {
          kind: 'PRACTITIONER',
          displayName: 'Doctora Quimbamba',
          city: 'Lima',
          status: 'ACTIVE',
        },
      })
      .expect(200);

    const found = await http()
      .post(`/search/${index}/_search`)
      .set(withTenant(tenantA))
      .send({ query: 'Quimbamba' })
      .expect(200);

    expect(found.body.total).toBeGreaterThanOrEqual(1);
    expect(found.body.hits.some((h: { id: string }) => h.id === id)).toBe(
      true,
    );
  });

  it('sella el tenantId del contexto: el mismo id indexado por otro tenant no aparece en la búsqueda del primero', async () => {
    const id = `prof-shared-${Date.now()}`;
    await http()
      .post(`/search/${index}/documents`)
      .set(withTenant(tenantA))
      .send({
        id,
        document: {
          kind: 'PRACTITIONER',
          displayName: 'Bartholomew Winklestrudel',
          city: 'Lima',
        },
      })
      .expect(200);
    await http()
      .post(`/search/${index}/documents`)
      .set(withTenant(tenantB))
      .send({
        id,
        document: {
          kind: 'PRACTITIONER',
          displayName: 'Zephyrina Quackenbroth',
          city: 'Cusco',
        },
      })
      .expect(200);

    // Mismo `id` de documento en dos tenants distintos: sin el sello de
    // tenant del servidor, la búsqueda de B podría devolver el término único
    // del documento de A (misma clave física en el índice, sin aislamiento).
    const fromB = await http()
      .post(`/search/${index}/_search`)
      .set(withTenant(tenantB))
      .send({ query: 'Winklestrudel' })
      .expect(200);
    expect(fromB.body.hits).toHaveLength(0);

    const ownHit = await http()
      .post(`/search/${index}/_search`)
      .set(withTenant(tenantB))
      .send({ query: 'Quackenbroth' })
      .expect(200);
    expect(ownHit.body.hits.some((h: { id: string }) => h.id === id)).toBe(
      true,
    );
  });

  it('UC-57 filtra por campo de la allowlist y rechaza un campo no declarado (422)', async () => {
    const id = `prof-filter-${Date.now()}`;
    await http()
      .post(`/search/${index}/documents`)
      .set(withTenant(tenantA))
      .send({
        id,
        document: {
          kind: 'ORGANIZATION',
          displayName: 'Clínica Andina',
          city: 'Arequipa',
          status: 'ACTIVE',
        },
      })
      .expect(200);

    const byFilter = await http()
      .post(`/search/${index}/_search`)
      .set(withTenant(tenantA))
      .send({ filters: [{ field: 'city', values: ['Arequipa'] }] })
      .expect(200);
    expect(byFilter.body.hits.some((h: { id: string }) => h.id === id)).toBe(
      true,
    );

    await http()
      .post(`/search/${index}/_search`)
      .set(withTenant(tenantA))
      .send({ filters: [{ field: 'not_a_real_field', values: ['x'] }] })
      .expect(422);
  });

  it('UC-57 elimina un documento y deja de aparecer en la búsqueda', async () => {
    const id = `prof-del-${Date.now()}`;
    await http()
      .post(`/search/${index}/documents`)
      .set(withTenant(tenantA))
      .send({ id, document: { kind: 'PRACTITIONER', displayName: 'Borrame' } })
      .expect(200);

    await http()
      .delete(`/search/${index}/documents/${id}`)
      .set(withTenant(tenantA))
      .expect(200)
      .expect((r) => expect(r.body.deleted).toBe(true));

    const after = await http()
      .post(`/search/${index}/_search`)
      .set(withTenant(tenantA))
      .send({ query: 'Borrame' })
      .expect(200);
    expect(after.body.hits.some((h: { id: string }) => h.id === id)).toBe(
      false,
    );
  });

  it('rechaza un índice fuera de la whitelist', async () => {
    await http()
      .post('/search/not_a_real_index/_search')
      .set(withTenant(tenantA))
      .send({ query: 'x' })
      .expect(404);
  });
});
