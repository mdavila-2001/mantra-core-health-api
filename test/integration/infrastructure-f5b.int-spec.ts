import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  bearer,
  camposObligatoriosDePaciente,
  type TestContext,
} from './harness';
import { DIAG } from '../../src/modules/diagnostics/diagnostics.concepts';
import {
  como,
  opsVersion,
  registrarOrganizacion,
  registrarPaciente,
  sql,
  type InfraOrg,
} from './infrastructure-fixture';

/**
 * F5b · puntos de toma de muestra contra la base real (CONTRATO-F2-F5 §F5b):
 * lista de puntos ACTIVE y disponibles (un bloqueo F2 lo saca), 404 entre
 * tenants, toma registrada en un punto (evento con collection_care_space_id),
 * 422 si el espacio no es un punto y el punto en la cola de trabajo.
 */
describe('Infraestructura F5b · puntos de toma', () => {
  let ctx: TestContext;
  let q: ReturnType<typeof sql>;
  const http = () => request(ctx.app.getHttpServer());
  const tag = randomUUID().slice(0, 6);
  let orgA: InfraOrg;
  let orgB: InfraOrg;
  const admin = () => ({
    ...bearer(ctx.adminToken),
    'X-Tenant-Id': orgA.tenantId,
  });
  const punto = async (org: InfraOrg, code: string) =>
    (
      await http()
        .post(`/sites/${org.siteId}/care-spaces`)
        .set(como(org))
        .send({
          code,
          name: `Toma ${code}`,
          formCode: 'LOC_FORM_ROOM',
          functionCode: 'SPACE_FN_SAMPLE_COLLECTION',
          activate: true,
          areaM2: 10,
        })
        .expect(201)
    ).body.id as string;

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    q = sql(ctx);
    orgA = await registrarOrganizacion(ctx, `F5BA-${tag}`);
    orgB = await registrarOrganizacion(ctx, `F5BB-${tag}`);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('F5b: puntos disponibles, bloqueo F2 los saca, toma en un punto y punto en la cola', async () => {
    const p1 = await punto(orgA, `TM1-${tag}`);
    const p2 = await punto(orgA, `TM2-${tag}`);
    const ajeno = await punto(orgB, `TMB-${tag}`);
    const sala = (
      await http()
        .post(`/sites/${orgA.siteId}/care-spaces`)
        .set(como(orgA))
        .send({
          code: `OF-${tag}`,
          name: 'Oficina',
          formCode: 'LOC_FORM_ROOM',
          functionCode: 'SPACE_FN_OFFICE_ADMIN',
          activate: true,
        })
        .expect(201)
    ).body.id as string;
    await http()
      .post(`/care-spaces/${p2}/availability`)
      .set(como(orgA))
      .set('If-Match-Ops', String(await opsVersion(ctx, p2)))
      .send({
        action: 'block',
        kindCode: 'BLOCK_ADMIN',
        reasonCode: 'BLOCK_RSN_OTHER',
        reasonText: 'Sin personal',
      })
      .expect(200);

    const list = await http()
      .get(`/sites/${orgA.siteId}/sample-collection-points`)
      .set(como(orgA))
      .expect(200);
    expect(list.body.map((p: any) => p.careSpace.id)).toEqual([p1]);
    expect(list.body[0]).toMatchObject({
      careSpace: { id: p1, code: `TM1-${tag}` },
      cell: { id: p1 },
    });
    await http()
      .get(`/sites/${orgA.siteId}/sample-collection-points`)
      .set(como(orgB))
      .expect(404);

    const campos = (await camposObligatoriosDePaciente(
      ctx,
    )) as unknown as Record<string, unknown>;
    const patient = (await registrarPaciente(ctx, orgA, `PB${tag}`, campos))
      .patientProfileId;
    const toma = (extra: Record<string, unknown>) =>
      http()
        .post('/diagnostics/specimens')
        .set(admin())
        .send({
          patientProfileId: patient,
          custodianTenantId: orgA.tenantId,
          specimenTypeConceptId: DIAG.SPECIMEN_TYPE_BLOOD_VENOUS,
          ...extra,
        });
    const noPunto = await toma({ collectionCareSpaceId: sala }).expect(422);
    expect(noPunto.body.reason).toBe('COLLECTION_POINT_INVALID');
    const bloqueado = await toma({ collectionCareSpaceId: p2 }).expect(422);
    expect(bloqueado.body.reason).toBe('COLLECTION_POINT_INVALID');
    const otro = await toma({ collectionCareSpaceId: ajeno });
    expect([404, 422]).toContain(otro.status);
    const ok = await toma({ collectionCareSpaceId: p1 }).expect(201);
    const [ev] = await q(
      'select collection_care_space_id, collection_site_id, event_type_concept_id from diagnostics.specimen_collection_events where specimen_id = ?',
      [ok.body.id],
    );
    expect(ev).toEqual({
      collection_care_space_id: p1,
      collection_site_id: orgA.siteId,
      event_type_concept_id: DIAG.COLLECTION_EVENT_COLLECTED,
    });
    const sinPunto = await toma({}).expect(201);
    const none = await q(
      'select count(*)::int as n from diagnostics.specimen_collection_events where specimen_id = ?',
      [sinPunto.body.id],
    );
    expect(none[0].n).toBe(0);

    // La cola de trabajo filtra por punto de toma (sin coincidencias: vacía).
    const cola = await http()
      .get('/diagnostics/work-orders')
      .query({ collectionCareSpaceId: p1 })
      .set(admin())
      .expect(200);
    expect(Array.isArray(cola.body)).toBe(true);
    for (const o of cola.body) expect(o.collectionPoint?.id ?? null).toBe(p1);
  });
});
