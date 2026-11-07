import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { CONCEPTS, SEED } from '../../src/common';
import { CLIN } from '../../src/modules/clinical/clinical.concepts';
import { PROF } from '../../src/modules/profiles/profiles.concepts';
import {
  bearer,
  bootstrapTestApp,
  camposObligatoriosDePaciente,
  deleteRegisteredOrganizations,
  type TestContext,
} from './harness';

/**
 * The center enters the paper / walk-in order itself (v4.2.96), against the
 * real app and Postgres: look the patient up by national id → create → list →
 * edit, and the limits (another center, a practitioner's order, an order
 * already received). Synthetic data (`@example.test`), random suffix.
 *
 * CANCEL is not exercised here: this suite runs without RLS (seeds need the
 * owner role) and `trg_service_request_performer_event_tenant` requires the
 * session tenant, which the app only sets with `RLS_ENFORCE=true`.
 */
describe('Portal del centro · orden cargada en mostrador (integración)', () => {
  let ctx: TestContext;
  const marca = randomUUID().slice(0, 8);
  const password = 'S3cret-passw0rd';
  const nationalId = `INT-INTAKE-${marca}`;
  const creados: { userId: string; tenantId: string }[] = [];
  const http = () => request(ctx.app.getHttpServer());

  let labA: { tenantId: string; token: string };
  let labB: { tenantId: string; token: string };
  let patientProfileId: string;
  let labStudy: string;
  let otherLabStudy: string;
  let doctorOrderId: string;

  const as = (lab: { tenantId: string; token: string }) => ({
    ...bearer(lab.token),
    'X-Tenant-Id': lab.tenantId,
  });

  async function registerLab(tag: string) {
    const email = `intake-${tag}-${marca}@example.test`;
    const res = await http()
      .post('/iam/auth/register-organization')
      .send({
        organization: {
          code: `INTAKE_${tag}_${marca}`,
          legalName: `Laboratorio ${tag} ${marca} S.R.L.`,
          tenantType: 'DIAGNOSTIC_CENTER',
          countryConceptId: CONCEPTS.COUNTRY_BO,
          jurisdictionConceptId: PROF.JURISDICTION_SEDES_SANTA_CRUZ,
        },
        owner: { email, password, name: 'Dueña', lastName: tag },
      })
      .expect(201);
    creados.push({ userId: res.body.ownerUserId, tenantId: res.body.tenantId });
    const login = await http()
      .post('/iam/auth/login')
      .send({ email, password })
      .expect(200);
    return {
      tenantId: res.body.tenantId as string,
      token: login.body.accessToken as string,
    };
  }

  const ordersOf = async (lab: { tenantId: string; token: string }) =>
    (
      await http()
        .get('/diagnostics/lab/orders')
        .set(as(lab))
        .query({ limit: 500 })
        .expect(200)
    ).body.items as Record<string, unknown>[];

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    labA = await registerLab('A');
    labB = await registerLab('B');

    const campos = await camposObligatoriosDePaciente(ctx);
    await http()
      .post('/iam/auth/register-patient')
      .send({
        ...campos,
        nationalId,
        password,
        displayName: `Paciente Mostrador ${marca}`,
        email: `intake-paciente-${marca}@example.test`,
      })
      .expect(201);
    const login = await http()
      .post('/iam/auth/login')
      .send({ nationalId, password })
      .expect(200);
    patientProfileId = (
      await http()
        .get('/diagnostic-results/me/orders')
        .set(bearer(login.body.accessToken as string))
        .expect(200)
    ).body.patientProfileId as string;

    const catalog = await http()
      .get('/clinical/study-catalog')
      .set({ ...bearer(ctx.adminToken), 'X-Tenant-Id': SEED.tenantId })
      .query({ family: 'LAB', limit: 2 })
      .expect(200);
    [labStudy, otherLabStudy] = (
      catalog.body.items as { conceptId: string }[]
    ).map((item) => item.conceptId);

    // A practitioner's order routed to lab A: the center may not edit it.
    doctorOrderId = (
      await http()
        .post('/clinical/service-requests')
        .set({ ...bearer(ctx.adminToken), 'X-Tenant-Id': SEED.tenantId })
        .send({
          custodianTenantId: SEED.tenantId,
          patientProfileId,
          codeConceptId: labStudy,
          categoryConceptId: CLIN.SERVICE_REQUEST_CATEGORY_LAB,
          performerTenantId: labA.tenantId,
        })
        .expect(201)
    ).body.id as string;
  });

  afterAll(async () => {
    await ctx.app.close();
    await deleteRegisteredOrganizations(creados);
  });

  it('busca al paciente por documento exacto; uno inexistente es 404', async () => {
    const res = await http()
      .post('/diagnostics/lab/patients/lookup')
      .set(as(labA))
      .send({ nationalId })
      .expect(200);
    expect(res.body).toMatchObject({ patientProfileId });
    expect(res.body.displayName).toEqual(expect.any(String));
    await http()
      .post('/diagnostics/lab/patients/lookup')
      .set(as(labA))
      .send({ nationalId: `NADIE-${marca}` })
      .expect(404);
  });

  it('alta → lista → edición, y cada paso queda en la base', async () => {
    const created = await http()
      .post('/diagnostics/lab/orders')
      .set(as(labA))
      .send({
        patientProfileId,
        codeConceptId: labStudy,
        category: 'LAB',
        externalRequesterName: 'Dra. Ejemplo',
        externalRequesterLicense: 'MP-123',
      })
      .expect(201);
    const orderId = created.body.orderId as string;
    expect(created.body).toMatchObject({
      status: 'DRAFT',
      registeredByPerformer: true,
      canEdit: true,
      requesterName: 'Dra. Ejemplo',
      externalRequesterLicense: 'MP-123',
      codeConceptId: labStudy,
    });

    const [row] = await ctx.orm.em
      .fork()
      .getConnection()
      .execute(
        `select custodian_tenant_id, performer_tenant_id, encounter_id,
                requester_profile_id, registered_by_performer
           from clinical.service_requests where id = ?`,
        [orderId],
      );
    expect(row).toEqual({
      custodian_tenant_id: labA.tenantId,
      performer_tenant_id: labA.tenantId,
      encounter_id: null,
      requester_profile_id: null,
      registered_by_performer: true,
    });

    const listed = (await ordersOf(labA)).find((o) => o.orderId === orderId);
    expect(listed).toMatchObject({
      canEdit: true,
      requesterName: 'Dra. Ejemplo',
    });
    expect((await ordersOf(labB)).some((o) => o.orderId === orderId)).toBe(
      false,
    );

    const edited = await http()
      .put(`/diagnostics/lab/orders/${orderId}`)
      .set(as(labA))
      .send({ codeConceptId: otherLabStudy, category: 'LAB' })
      .expect(200);
    expect(edited.body).toMatchObject({
      codeConceptId: otherLabStudy,
      externalRequesterName: null,
      requesterName: 'A pedido del paciente',
    });
    const reread = (await ordersOf(labA)).find((o) => o.orderId === orderId);
    expect(reread).toMatchObject({ codeConceptId: otherLabStudy });

    await http()
      .put(`/diagnostics/lab/orders/${orderId}`)
      .set(as(labB))
      .send({ codeConceptId: labStudy, category: 'LAB' })
      .expect(404);
  });

  it('una orden ya recibida no se edita (409)', async () => {
    const orderId = (
      await http()
        .post('/diagnostics/lab/orders')
        .set(as(labA))
        .send({ patientProfileId, codeConceptId: labStudy, category: 'LAB' })
        .expect(201)
    ).body.orderId as string;
    await http()
      .post(`/diagnostics/lab/orders/${orderId}/transitions`)
      .set(as(labA))
      .send({ action: 'RECEIVE' })
      .expect(200);
    await http()
      .put(`/diagnostics/lab/orders/${orderId}`)
      .set(as(labA))
      .send({ codeConceptId: otherLabStudy, category: 'LAB' })
      .expect(409);
  });

  it('la orden de un médico no la edita el centro (409) y dice que no es suya', async () => {
    const listed = (await ordersOf(labA)).find(
      (o) => o.orderId === doctorOrderId,
    );
    expect(listed).toMatchObject({
      registeredByPerformer: false,
      canEdit: false,
    });
    await http()
      .put(`/diagnostics/lab/orders/${doctorOrderId}`)
      .set(as(labA))
      .send({ codeConceptId: otherLabStudy, category: 'LAB' })
      .expect(409);
  });

  it('inválidos: paciente inexistente 422, estudio fuera del catálogo 422, campo de más o categoría ajena 400', async () => {
    await http()
      .post('/diagnostics/lab/orders')
      .set(as(labA))
      .send({
        patientProfileId: randomUUID(),
        codeConceptId: labStudy,
        category: 'LAB',
      })
      .expect(422);
    await http()
      .post('/diagnostics/lab/orders')
      .set(as(labA))
      .send({ patientProfileId, codeConceptId: randomUUID(), category: 'LAB' })
      .expect(422);
    await http()
      .post('/diagnostics/lab/orders')
      .set(as(labA))
      .send({
        patientProfileId,
        codeConceptId: labStudy,
        category: 'LAB',
        encounterId: randomUUID(),
      })
      .expect(400);
    await http()
      .post('/diagnostics/lab/orders')
      .set(as(labA))
      .send({ patientProfileId, codeConceptId: labStudy, category: 'OTHER' })
      .expect(400);
  });

  it('no autorizado: sin membresía del centro no se carga ni se busca', async () => {
    await http()
      .post('/diagnostics/lab/orders')
      .set({ ...bearer(labB.token), 'X-Tenant-Id': labA.tenantId })
      .send({ patientProfileId, codeConceptId: labStudy, category: 'LAB' })
      .expect(403);
    await http()
      .post('/diagnostics/lab/patients/lookup')
      .set({ ...bearer(labB.token), 'X-Tenant-Id': labA.tenantId })
      .send({ nationalId })
      .expect(403);
  });
});
