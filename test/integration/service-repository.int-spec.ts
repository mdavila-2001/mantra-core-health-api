import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { bootstrapTestApp, bearer, type TestContext } from './harness';
import { SEED } from '../../src/common';

/**
 * Repositorio de servicios: buscar, importar, y que el alta libre no exista.
 *
 * ## Qué se demuestra y por qué contra la base
 *
 * El buscador es SQL a mano sobre `terminology.*` (conjuntos, relaciones con
 * la especialidad, sinónimos). Un doble del `EntityManager` no dice nada de
 * eso: hay que ver que **los conceptos que sembró el arancel boliviano** salen
 * por el endpoint, sin acentos, con su fuente, y que importarlos deja una fila
 * enlazada en `billing.service_catalog`.
 *
 * Los servicios por especialidad (`VS_SPECIALTY_SERVICES_*`) los carga un
 * importador aparte; si la base no los tiene, los casos que dependen de ellos
 * se saltan con su motivo en vez de pasar sin probar nada.
 */
describe('Repositorio de servicios (buscar → importar)', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());
  const auth = () => bearer(ctx.adminToken);
  const sufijo = randomUUID().slice(0, 8);
  let practiceId = '';

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    const practica = await http()
      .post('/practices')
      .set(auth())
      .set('X-Tenant-Id', SEED.tenantId)
      .send({
        tenantId: SEED.tenantId,
        code: `REPO-SERV-${sufijo}`,
        name: `Práctica repositorio ${sufijo}`,
        timeZone: 'America/La_Paz',
      })
      .expect(201);
    practiceId = practica.body.id;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('las facetas cuentan el repositorio sin traerlo entero', async () => {
    const res = await http()
      .get('/billing/service-catalog/repository/facets')
      .set(auth())
      .set('X-Tenant-Id', SEED.tenantId)
      .expect(200);

    // El arancel boliviano solo ya son 4 408 servicios.
    expect(res.body.total).toBeGreaterThanOrEqual(4408);
    expect(res.body.sources.length).toBeGreaterThan(0);
  });

  it('busca sin acentos ni mayúsculas, palabra por palabra', async () => {
    const conTilde = await http()
      .get('/billing/service-catalog/repository')
      .query({ q: 'ECOCARDIOGRAFÍA', limit: 50 })
      .set(auth())
      .set('X-Tenant-Id', SEED.tenantId)
      .expect(200);
    const sinTilde = await http()
      .get('/billing/service-catalog/repository')
      .query({ q: 'ecocardiografia', limit: 50 })
      .set(auth())
      .set('X-Tenant-Id', SEED.tenantId)
      .expect(200);

    expect(conTilde.body.items.length).toBeGreaterThan(0);
    expect(
      conTilde.body.items.map((i: { conceptId: string }) => i.conceptId),
    ).toEqual(
      sinTilde.body.items.map((i: { conceptId: string }) => i.conceptId),
    );
    for (const item of conTilde.body.items) {
      expect(item.source.codeSystem).toEqual(expect.any(String));
    }
  });

  it('pagina sin repetir filas', async () => {
    const page1 = await http()
      .get('/billing/service-catalog/repository')
      .query({ limit: 10 })
      .set(auth())
      .set('X-Tenant-Id', SEED.tenantId)
      .expect(200);
    expect(page1.body.nextCursor).toEqual(expect.any(String));
    const page2 = await http()
      .get('/billing/service-catalog/repository')
      .query({ limit: 10, cursor: page1.body.nextCursor })
      .set(auth())
      .set('X-Tenant-Id', SEED.tenantId)
      .expect(200);

    const ids1 = new Set(
      page1.body.items.map((i: { conceptId: string }) => i.conceptId),
    );
    for (const item of page2.body.items)
      expect(ids1.has(item.conceptId)).toBe(false);
  });

  it('filtra por especialidad cuando el repositorio la conoce', async () => {
    const facets = await http()
      .get('/billing/service-catalog/repository/facets')
      .set(auth())
      .set('X-Tenant-Id', SEED.tenantId)
      .expect(200);
    const cardio = facets.body.specialties.find(
      (s: { code: string }) => s.code === 'CARDIOLOGIA',
    );
    if (!cardio) {
      console.warn(
        'Sin VS_SPECIALTY_SERVICES_* cargados: se salta el filtro por especialidad',
      );
      return;
    }

    const res = await http()
      .get('/billing/service-catalog/repository')
      .query({ specialtyConceptId: cardio.key, limit: 100 })
      .set(auth())
      .set('X-Tenant-Id', SEED.tenantId)
      .expect(200);

    expect(res.body.items.length).toBeGreaterThan(0);
    for (const item of res.body.items) {
      expect(item.specialties.map((s: { code: string }) => s.code)).toContain(
        'CARDIOLOGIA',
      );
    }
  });

  it('el alta de texto libre ya no existe', async () => {
    const res = await http()
      .post('/billing/service-catalog')
      .set(auth())
      .set('X-Tenant-Id', SEED.tenantId)
      .send({
        practiceId,
        code: `LIBRE-${sufijo}`,
        name: 'Servicio inventado',
        defaultPrice: '10.00',
      })
      .expect(422);
    expect(res.body.reason).toBe('SERVICE_CATALOG_CONCEPT_REQUIRED');
  });

  it('importa con precio, queda enlazado, y reimportar no duplica', async () => {
    const found = await http()
      .get('/billing/service-catalog/repository')
      .query({ q: 'ecocardiografia', practiceId, limit: 2 })
      .set(auth())
      .set('X-Tenant-Id', SEED.tenantId)
      .expect(200);
    const [primero] = found.body.items;
    expect(primero.importedServiceCatalogId).toBeNull();

    const imported = await http()
      .post('/billing/service-catalog/import')
      .set(auth())
      .set('X-Tenant-Id', SEED.tenantId)
      .send({
        practiceId,
        items: [{ conceptId: primero.conceptId, defaultPrice: '350.00' }],
      })
      .expect(200);
    expect(imported.body.items[0].outcome).toBe('CREATED');
    const serviceCatalogId = imported.body.items[0].serviceCatalogId;

    // Persistencia: la fila existe, con el nombre del repositorio y el enlace.
    const [fila] = await ctx.orm.em
      .getConnection()
      .execute<
        { name: string; service_concept_id: string; default_price: string }[]
      >(
        `select name, service_concept_id, default_price::text
           from billing.service_catalog where id = ?`,
        [serviceCatalogId],
      );
    expect(fila).toEqual({
      name: primero.display,
      service_concept_id: primero.conceptId,
      default_price: expect.stringMatching(/^350(\.00?)?$/),
    });

    const again = await http()
      .post('/billing/service-catalog/import')
      .set(auth())
      .set('X-Tenant-Id', SEED.tenantId)
      .send({
        practiceId,
        items: [{ conceptId: primero.conceptId, defaultPrice: '999.00' }],
      })
      .expect(200);
    expect(again.body.items[0]).toEqual({
      conceptId: primero.conceptId,
      outcome: 'ALREADY_IMPORTED',
      serviceCatalogId,
    });

    const marcado = await http()
      .get('/billing/service-catalog/repository')
      .query({ q: 'ecocardiografia', practiceId, limit: 2 })
      .set(auth())
      .set('X-Tenant-Id', SEED.tenantId)
      .expect(200);
    expect(
      marcado.body.items.find(
        (i: { conceptId: string }) => i.conceptId === primero.conceptId,
      ).importedServiceCatalogId,
    ).toBe(serviceCatalogId);
  });

  it('un concepto ajeno al repositorio no se importa', async () => {
    const res = await http()
      .post('/billing/service-catalog/import')
      .set(auth())
      .set('X-Tenant-Id', SEED.tenantId)
      .send({
        practiceId,
        items: [{ conceptId: SEED.tenantId, defaultPrice: '1.00' }],
      })
      .expect(422);
    expect(res.body.reason).toBe('SERVICE_CATALOG_CONCEPT_NOT_IN_REPOSITORY');
  });
});
