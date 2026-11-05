import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { bootstrapTestApp, bearer, type TestContext } from './harness';
import { CONCEPTS } from '../../src/common/constants/concepts';
import { DELEG } from '../../src/modules/delegated_access/delegated_access.concepts';
import {
  armarPlanta,
  como,
  crearPersonal,
  registrarOrganizacion,
  sql,
  type InfraOrg,
  type Planta,
} from './infrastructure-fixture';

/**
 * F5f · contabilidad por espacio y por unidad contra la base real
 * (CONTRATO-F2-F5 §F5f): ubicar un activo (404 entre tenants, 422 de otra
 * práctica, 412 de versión), ligar un centro de costo a una unidad (409 si ya
 * tiene uno activo) y el bloqueo EQUIPMENT del retiro.
 */
describe('Infraestructura F5f · integración', () => {
  let ctx: TestContext;
  let q: ReturnType<typeof sql>;
  const http = () => request(ctx.app.getHttpServer());
  const tag = randomUUID().slice(0, 6);
  let orgA: InfraOrg;
  let orgB: InfraOrg;
  let planta: Planta;
  let plantaB: Planta;

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    q = sql(ctx);
    orgA = await registrarOrganizacion(ctx, `F5FA-${tag}`);
    orgB = await registrarOrganizacion(ctx, `F5FB-${tag}`);
    planta = await armarPlanta(ctx, orgA, `F5F-${tag}`, 1);
    plantaB = await armarPlanta(ctx, orgB, `F5FX-${tag}`, 1);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('F5f: activo en espacio, centro de costo por unidad y bloqueo EQUIPMENT', async () => {
    // Segunda práctica del mismo tenant, con su sede, espacio y unidad.
    const p2 = (
      await http()
        .post('/practices')
        .set(bearer(ctx.adminToken))
        .send({
          tenantId: orgA.tenantId,
          code: `P2-${tag}`,
          name: 'Otra práctica',
          timeZone: 'America/La_Paz',
        })
        .expect(201)
    ).body.id;
    const site2 = (
      await http()
        .post(`/practices/${p2}/sites`)
        .set(como(orgA))
        .send({ code: `S2-${tag}`, name: 'Sede 2' })
        .expect(201)
    ).body.id;
    const otraPractica = await armarPlanta(
      ctx,
      { ...orgA, practiceId: p2, siteId: site2 },
      `F5F2-${tag}`,
      1,
    );

    const item = randomUUID();
    await q(
      `insert into accounting.infrastructure_items (id, practice_id, tenant_id, name, category_concept_id, location_text, status_concept_id, created_at, updated_at)
       values (?, ?, ?, 'Monitor multiparámetro', ?, 'Piso 2', ?, now(), now())`,
      [
        item,
        orgA.practiceId,
        orgA.tenantId,
        CONCEPTS.STATE_ACTIVE,
        CONCEPTS.STATE_ACTIVE,
      ],
    );
    const url = `/accounting/infrastructure-items/${item}`;
    await http()
      .patch(url)
      .set(como(orgA))
      .send({ careSpaceId: plantaB.room })
      .expect(404);
    const mismatch = await http()
      .patch(url)
      .set(como(orgA))
      .send({ careSpaceId: otraPractica.room })
      .expect(422);
    expect(mismatch.body.reason).toBe('INFRASTRUCTURE_SPACE_PRACTICE_MISMATCH');
    await http()
      .patch(url)
      .set(como(orgA))
      .set('If-Match', '999')
      .send({ careSpaceId: planta.room })
      .expect(412);
    // Otro tenant no ve el activo; enfermería no puede ubicarlo.
    await http()
      .patch(url)
      .set(como(orgB))
      .send({ careSpaceId: planta.room })
      .expect(404);
    const nurse = await crearPersonal(
      ctx,
      orgA,
      `F5FN-${tag}`,
      DELEG.ASSIGN_ROLE_NURSE,
      { site: orgA.siteId },
    );
    await http()
      .patch(url)
      .set(como(nurse))
      .send({ careSpaceId: planta.room })
      .expect(403);
    await http()
      .get('/accounting/infrastructure-items')
      .query({ practiceId: orgA.practiceId })
      .set(como(nurse))
      .expect(403);

    const located = await http()
      .patch(url)
      .set(como(orgA))
      .send({ careSpaceId: planta.room })
      .expect(200);
    expect(located.body).toMatchObject({
      id: item,
      careSpace: { id: planta.room, path: expect.stringContaining(' / ') },
      locationText: 'Piso 2',
    });
    const list = await http()
      .get('/accounting/infrastructure-items')
      .query({ practiceId: orgA.practiceId })
      .set(como(orgA))
      .expect(200);
    expect(list.body.map((i: any) => [i.id, i.careSpace?.id])).toEqual([
      [item, planta.room],
    ]);
    await http()
      .get('/accounting/infrastructure-items')
      .query({ practiceId: orgA.practiceId })
      .set(como(orgB))
      .expect(404);

    // El activo ubicado bloquea el retiro de la sala y del edificio.
    for (const space of [planta.room, planta.building]) {
      const check = await http()
        .get(`/care-spaces/${space}/retire-check`)
        .set(como(orgA))
        .expect(200);
      expect(
        check.body.blockers.find((b: any) => b.kind === 'EQUIPMENT'),
      ).toMatchObject({ count: 1, sampleIds: [item] });
      expect(check.body.unverifiable).toEqual([]);
    }

    // Centro de costo ↔ unidad.
    const [cc1, cc2] = [randomUUID(), randomUUID()];
    for (const [id, code] of [
      [cc1, `CC1-${tag}`],
      [cc2, `CC2-${tag}`],
    ]) {
      await q(
        `insert into accounting.cost_centers (id, practice_id, tenant_id, code, name, status_concept_id, created_at, updated_at)
         values (?, ?, ?, ?, ?, ?, now(), now())`,
        [id, orgA.practiceId, orgA.tenantId, code, code, CONCEPTS.STATE_ACTIVE],
      );
    }
    const link = (id: string) => `/accounting/cost-centers/${id}/unit-link`;
    await http()
      .post(link(cc1))
      .set(como(orgA))
      .send({ clinicalUnitId: plantaB.unit })
      .expect(404);
    const unitMismatch = await http()
      .post(link(cc1))
      .set(como(orgA))
      .send({ clinicalUnitId: otraPractica.unit })
      .expect(422);
    expect(unitMismatch.body.reason).toBe('COST_CENTER_UNIT_PRACTICE_MISMATCH');
    await http()
      .post(link(cc1))
      .set(como(nurse))
      .send({ clinicalUnitId: planta.unit })
      .expect(403);
    const linked = await http()
      .post(link(cc1))
      .set(como(orgA))
      .send({ clinicalUnitId: planta.unit })
      .expect(200);
    expect(linked.body).toMatchObject({
      id: cc1,
      clinicalUnit: { id: planta.unit },
    });
    const taken = await http()
      .post(link(cc2))
      .set(como(orgA))
      .send({ clinicalUnitId: planta.unit })
      .expect(409);
    expect(taken.body.reason).toBe('UNIT_ALREADY_HAS_COST_CENTER');
    const centers = await http()
      .get('/accounting/cost-centers')
      .query({ practiceId: orgA.practiceId })
      .set(como(orgA))
      .expect(200);
    expect(
      centers.body.map((c: any) => [c.id, c.clinicalUnit?.id ?? null]),
    ).toEqual([
      [cc1, planta.unit],
      [cc2, null],
    ]);

    const events = await q(
      `select event_type, aggregate_id from messaging.domain_events
        where aggregate_id in (?, ?) order by occurred_at`,
      [item, cc1],
    );
    expect(events.map((e: any) => e.event_type)).toEqual([
      'accounting.infrastructure_item.located',
      'accounting.cost_center.unit_linked',
    ]);
  });
});
