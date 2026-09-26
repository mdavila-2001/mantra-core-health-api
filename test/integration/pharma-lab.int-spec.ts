import request from 'supertest';
import { bootstrapTestApp, bearer, type TestContext } from './harness';
import { SEED } from '../../src/common';
import { PHL } from '../../src/modules/pharma_lab/pharma_lab.concepts';

/**
 * BR-26 · AG-30: con el módulo 69 en la base (`SQL/69_pharma_lab` + el patch
 * v4.2.28 del modelo), ninguna ruta de `pharma_lab` responde 500 por
 * `relation "pharma_lab.…" does not exist`.
 *
 * Antes de este cambio la API tenía las entidades y los controladores pero la
 * base no tenía las tablas: crear o listar un laboratorio daba 500. Esta prueba
 * corre contra el Postgres real (`ORM_SCHEMA_SYNC=off`), sin mocks.
 */
describe('BR-26 · pharma_lab existe en la base (AG-30)', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());
  let labId = '';

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
  }, 300_000);

  afterAll(async () => {
    await ctx?.app.close();
  });

  it('el esquema tiene sus 31 tablas y las 4 historias de auditoría', async () => {
    const em = ctx.orm.em.fork();
    const [{ tables }] = await em
      .getConnection()
      .execute(
        `select count(*)::int as tables from information_schema.tables where table_schema = 'pharma_lab'`,
      );
    expect(tables).toBe(31);
    const history = await em.getConnection().execute(
      `select table_name from information_schema.tables
        where table_schema = 'audit'
          and table_name in ('pharma_lab_staff_history', 'pharma_products_history',
                             'regulatory_documents_history', 'visit_requests_history')`,
    );
    expect(history).toHaveLength(4);
  });

  it('registrar un laboratorio responde 201 (antes, 500)', async () => {
    const res = await http()
      .post('/pharma-labs')
      .set(bearer(ctx.adminToken))
      .send({
        tenantId: SEED.tenantId,
        labTypeConceptId: PHL.LAB_TYPE_PHARMACEUTICAL,
        legalName: 'Laboratorio de prueba BR-26',
      })
      .expect(201);
    labId = res.body.id;
    expect(labId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('listar y consultar el laboratorio responden 200 con la fila real', async () => {
    const list = await http()
      .get('/pharma-labs')
      .set(bearer(ctx.adminToken))
      .expect(200);
    expect(list.body.map((lab: { id: string }) => lab.id)).toContain(labId);

    const one = await http()
      .get(`/pharma-labs/${labId}`)
      .set(bearer(ctx.adminToken))
      .expect(200);
    expect(one.body.legalName).toBe('Laboratorio de prueba BR-26');
  });

  it.each(['staff', 'link-events', 'medical-visitors', 'products'])(
    'GET /pharma-labs/:id/%s no responde 500',
    async (segment) => {
      const res = await http()
        .get(`/pharma-labs/${labId}/${segment}`)
        .set(bearer(ctx.adminToken));
      expect(res.status).toBe(200);
    },
  );
});
