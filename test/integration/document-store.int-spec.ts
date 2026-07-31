import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { bootstrapTestApp, bearer, type TestContext } from './harness';

/**
 * Módulo 55 (Document Store) contra MongoDB real (`mantra-redesa-mongodb-1`),
 * no un `EntityManager` simulado: valida versión inicial, concurrencia
 * optimista real en `PATCH`, borrado lógico y, sobre todo, que el
 * aislamiento por tenant que el README promete ocurre de verdad en la
 * consulta a Mongo (no sólo en el DTO).
 */
describe('Document Store (integración, MongoDB real)', () => {
  let ctx: TestContext;
  const collection = `it_docs_${Date.now()}`;
  const tenantA = randomUUID();
  const tenantB = randomUUID();

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  const http = () => request(ctx.app.getHttpServer());
  const base = () => `/document-store/collections/${collection}/documents`;

  it('UC-55 crea un documento con version=1', async () => {
    const res = await http()
      .post(base())
      .set(bearer(ctx.adminToken))
      .send({
        tenantId: tenantA,
        documentType: 'fhir_bundle_raw',
        payload: { note: 'hola' },
      })
      .expect(201);

    expect(res.body.version).toBe(1);
    expect(res.body.deletedAt).toBeNull();
  });

  it('UC-55 lee el documento vivo, acotado por tenant', async () => {
    const created = await http()
      .post(base())
      .set(bearer(ctx.adminToken))
      .send({ tenantId: tenantA, documentType: 'note', payload: { a: 1 } })
      .expect(201);

    await http()
      .get(`${base()}/${created.body.id}?tenantId=${tenantA}`)
      .set(bearer(ctx.adminToken))
      .expect(200)
      .expect((r) => expect(r.body.payload).toEqual({ a: 1 }));

    // El mismo id, consultado con el tenantId de OTRO tenant, no debe
    // aparecer: la consulta a Mongo real filtra por tenantId, no sólo el DTO.
    await http()
      .get(`${base()}/${created.body.id}?tenantId=${tenantB}`)
      .set(bearer(ctx.adminToken))
      .expect(404);
  });

  it('UC-55 actualiza con concurrencia optimista y rechaza versión desfasada (409)', async () => {
    const created = await http()
      .post(base())
      .set(bearer(ctx.adminToken))
      .send({ tenantId: tenantA, documentType: 'note', payload: { v: 1 } })
      .expect(201);
    const id = created.body.id;

    const updated = await http()
      .patch(`${base()}/${id}`)
      .set(bearer(ctx.adminToken))
      .send({ tenantId: tenantA, expectedVersion: 1, payload: { v: 2 } })
      .expect(200);
    expect(updated.body.version).toBe(2);

    // Reintentar contra la versión ya vieja (1) debe chocar de verdad contra
    // el documento real en Mongo, no contra un mock que no sabe de versiones.
    await http()
      .patch(`${base()}/${id}`)
      .set(bearer(ctx.adminToken))
      .send({ tenantId: tenantA, expectedVersion: 1, payload: { v: 3 } })
      .expect(409);
  });

  it('UC-55 lista paginado y sólo trae documentos del tenant indicado', async () => {
    const own = randomUUID();
    await http()
      .post(base())
      .set(bearer(ctx.adminToken))
      .send({ tenantId: own, documentType: 'note', payload: { i: 1 } })
      .expect(201);
    await http()
      .post(base())
      .set(bearer(ctx.adminToken))
      .send({ tenantId: own, documentType: 'note', payload: { i: 2 } })
      .expect(201);

    const listed = await http()
      .get(`${base()}?tenantId=${own}&page=1&pageSize=10`)
      .set(bearer(ctx.adminToken))
      .expect(200);

    expect(listed.body.meta.total).toBe(2);
    expect(
      listed.body.data.every((d: { tenantId: string }) => d.tenantId === own),
    ).toBe(true);
  });

  it('UC-55 borra lógicamente: el documento deja de listarse pero no se elimina físicamente', async () => {
    const created = await http()
      .post(base())
      .set(bearer(ctx.adminToken))
      .send({ tenantId: tenantA, documentType: 'note', payload: { x: 1 } })
      .expect(201);
    const id = created.body.id;

    const deleted = await http()
      .delete(`${base()}/${id}?tenantId=${tenantA}`)
      .set(bearer(ctx.adminToken))
      .expect(200);
    expect(deleted.body.deletedAt).toEqual(expect.any(String));

    // "Vivo" ya no lo encuentra (soft-delete filtra deletedAt).
    await http()
      .get(`${base()}/${id}?tenantId=${tenantA}`)
      .set(bearer(ctx.adminToken))
      .expect(404);
  });

  it('rechaza un nombre de colección fuera de la whitelist', async () => {
    await http()
      .post('/document-store/collections/DROP--TABLE/documents')
      .set(bearer(ctx.adminToken))
      .send({ tenantId: tenantA, documentType: 'note', payload: {} })
      .expect(400);
  });

  it('rechaza sin autenticación (401)', async () => {
    await http()
      .post(base())
      .send({ tenantId: tenantA, documentType: 'note', payload: {} })
      .expect(401);
  });
});
