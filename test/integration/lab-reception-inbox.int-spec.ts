import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { CONCEPTS, SEED, TokenService, createdBy } from '../../src/common';
import { CLIN } from '../../src/modules/clinical/clinical.concepts';
import { DIAG } from '../../src/modules/diagnostics/diagnostics.concepts';
import { DIR } from '../../src/modules/directory/directory.concepts';
import { TenantMemberships } from '../../src/modules/directory/entities';
import { Users } from '../../src/modules/iam/entities';
import { PROF } from '../../src/modules/profiles/profiles.concepts';
import {
  bearer,
  bootstrapTestApp,
  camposObligatoriosDePaciente,
  deleteRegisteredOrganizations,
  ensureTestSession,
  type TestContext,
} from './harness';

/**
 * Recepción de muestras del laboratorio, contra la aplicación real y Postgres.
 *
 * Lo que los unitarios no pueden probar, porque ahí el repositorio y las
 * membresías son dobles:
 *
 * 1. Que la bandeja encuentre la orden por `performer_tenant_id` —la orden la
 *    emite otra organización— y que el laboratorio de al lado no la vea.
 * 2. Que el dueño de un laboratorio recién registrado, con sólo el rol global
 *    `USER`, pueda recibir la muestra (antes: 403 por `@Roles`), y que un
 *    paciente no pueda leer la bandeja.
 * 3. Que acesionar saque la orden de la bandeja.
 */
describe('Recepción de muestras del laboratorio (integración)', () => {
  let ctx: TestContext;
  const marca = randomUUID().slice(0, 8);
  const password = 'S3cret-passw0rd';
  const creados: { userId: string; tenantId: string }[] = [];

  const http = () => request(ctx.app.getHttpServer());
  const admin = () => bearer(ctx.adminToken);

  let labA: { tenantId: string; token: string };
  let labB: { tenantId: string; token: string };
  let staffA: string;
  let pacienteToken: string;
  let pacientePerfil: string;
  let ordenId: string;

  /** Alta pública de un laboratorio (DIAGNOSTIC_CENTER) y login de su dueño. */
  async function registrarLaboratorio(etiqueta: string) {
    const email = `labrec-${etiqueta}-${marca}@example.test`;
    const res = await http()
      .post('/iam/auth/register-organization')
      .send({
        organization: {
          code: `LABREC_${etiqueta}_${marca}`,
          legalName: `Laboratorio ${etiqueta} ${marca} S.R.L.`,
          tenantType: 'DIAGNOSTIC_CENTER',
          countryConceptId: CONCEPTS.COUNTRY_BO,
          jurisdictionConceptId: PROF.JURISDICTION_SEDES_SANTA_CRUZ,
        },
        owner: { email, password, name: 'Dueña', lastName: etiqueta },
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

  /** Un técnico invitado al laboratorio: membresía STAFF, rol global USER. */
  async function tecnico(tenantId: string): Promise<string> {
    const em = ctx.orm.em.fork();
    const userId = randomUUID();
    em.create(
      Users,
      {
        id: userId,
        statusConceptId: CONCEPTS.USER_ACTIVE,
        displayName: 'Técnica de laboratorio',
        mfaStatusConceptId: CONCEPTS.MFA_DISABLED,
        emailVerified: true,
        phoneVerified: false,
        ...createdBy(ctx.adminUserId),
      },
      { partial: true },
    );
    await em.flush();
    em.create(
      TenantMemberships,
      {
        userId,
        tenantId,
        tenantRoleConceptId: DIR.ROLE_STAFF,
        statusConceptId: DIR.MEMBERSHIP_ACTIVE,
        accessScopeConceptId: DIR.SCOPE_ALL_TENANT,
        startDate: new Date(),
        ...createdBy(ctx.adminUserId),
      },
      { partial: true },
    );
    await em.flush();
    creados.push({ userId, tenantId });
    await ensureTestSession(ctx.orm, userId, `session-labrec-${marca}`);
    return ctx.app
      .get(TokenService)
      .signAccessToken(userId, `session-labrec-${marca}`, ['USER'], [tenantId]);
  }

  /** La bandeja, como la pide la pantalla. */
  function bandeja(
    token: string,
    tenantId: string,
    body: Record<string, unknown> = {},
  ) {
    return http()
      .post('/diagnostics/service-requests/inbox')
      .set({ ...bearer(token), 'X-Tenant-Id': tenantId })
      .send(body);
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    labA = await registrarLaboratorio('A');
    labB = await registrarLaboratorio('B');
    staffA = await tecnico(labA.tenantId);

    const campos = await camposObligatoriosDePaciente(ctx);
    const nationalId = `INT-LABREC-${marca}`;
    await http()
      .post('/iam/auth/register-patient')
      .send({
        ...campos,
        nationalId,
        password,
        displayName: `Paciente Recepción ${marca}`,
        email: `labrec-paciente-${marca}@example.test`,
      })
      .expect(201);
    const login = await http()
      .post('/iam/auth/login')
      .send({ nationalId, password })
      .expect(200);
    pacienteToken = login.body.accessToken as string;
    const propias = await http()
      .get('/diagnostic-results/me/orders')
      .set(bearer(pacienteToken))
      .expect(200);
    pacientePerfil = propias.body.patientProfileId as string;

    // La clínica (tenant por defecto) emite la orden y la deriva al
    // laboratorio A.
    const orden = await http()
      .post('/clinical/service-requests')
      .set({ ...admin(), 'X-Tenant-Id': SEED.tenantId })
      .send({
        custodianTenantId: SEED.tenantId,
        patientProfileId: pacientePerfil,
        codeConceptId: CLIN.SERVICE_REQUEST_CATEGORY_LAB,
        categoryConceptId: CLIN.SERVICE_REQUEST_CATEGORY_LAB,
        performerTenantId: labA.tenantId,
      })
      .expect(201);
    ordenId = orden.body.id as string;
  });

  afterAll(async () => {
    await ctx.app.close();
    await deleteRegisteredOrganizations(creados);
  });

  it('correcto: la dueña del laboratorio A ve la orden derivada a su laboratorio', async () => {
    const res = await bandeja(labA.token, labA.tenantId).expect(200);
    const item = res.body.items.find(
      (i: { serviceRequestId: string }) => i.serviceRequestId === ordenId,
    );
    expect(item).toMatchObject({
      patientProfileId: pacientePerfil,
      requestingTenantId: SEED.tenantId,
      specimens: [],
    });
  });

  it('correcto: el técnico invitado (STAFF) también la ve', async () => {
    const res = await bandeja(staffA, labA.tenantId).expect(200);
    expect(
      res.body.items.some(
        (i: { serviceRequestId: string }) => i.serviceRequestId === ordenId,
      ),
    ).toBe(true);
  });

  it('límite: el laboratorio B no ve una orden derivada al A', async () => {
    const res = await bandeja(labB.token, labB.tenantId).expect(200);
    expect(
      res.body.items.some(
        (i: { serviceRequestId: string }) => i.serviceRequestId === ordenId,
      ),
    ).toBe(false);
  });

  it('no autorizado: un paciente no lee la bandeja del tenant al que pertenece', async () => {
    await bandeja(pacienteToken, SEED.tenantId).expect(403);
  });

  it('inválido: cursor corrupto y tope fuera de rango son 400', async () => {
    await bandeja(labA.token, labA.tenantId, { cursor: '%%%' }).expect(400);
    await bandeja(labA.token, labA.tenantId, { limit: 0 }).expect(400);
  });

  it('el catálogo de tipo de espécimen se publica sembrado', async () => {
    const res = await http()
      .get('/system-context/dynamic-enums')
      .query({ code: 'specimen-type' })
      .expect(200);
    expect(res.body.options.map((o: { code: string }) => o.code)).toContain(
      'BLDV',
    );
  });

  it('recibir la muestra y acesionarla: la orden pasa por la bandeja con su muestra y después sale', async () => {
    const auth = { ...bearer(labA.token), 'X-Tenant-Id': labA.tenantId };
    const specimen = await http()
      .post('/diagnostics/specimens')
      .set(auth)
      .send({
        patientProfileId: pacientePerfil,
        custodianTenantId: labA.tenantId,
        specimenTypeConceptId: DIAG.SPECIMEN_TYPE_BLOOD_VENOUS,
        serviceRequestId: ordenId,
      })
      .expect(201);
    await http()
      .post(`/diagnostics/specimens/${specimen.body.id}/containers`)
      .set(auth)
      .send({
        containerIdentifier: `TUBO-${marca}`,
        containerTypeConceptId: DIAG.CONTAINER_TYPE_TUBE_LAVENDER_EDTA,
      })
      .expect(201);

    const conMuestra = await bandeja(labA.token, labA.tenantId, {
      patientQuery: `Recepción ${marca}`,
    }).expect(200);
    const item = conMuestra.body.items.find(
      (i: { serviceRequestId: string }) => i.serviceRequestId === ordenId,
    );
    expect(item.specimens).toHaveLength(1);
    expect(item.specimens[0].containers[0].containerIdentifier).toBe(
      `TUBO-${marca}`,
    );

    await http()
      .post('/diagnostics/accessions')
      .set(auth)
      .send({
        patientProfileId: pacientePerfil,
        custodianTenantId: labA.tenantId,
        specimenIds: [specimen.body.id],
        serviceRequestId: ordenId,
      })
      .expect(201);

    const despues = await bandeja(labA.token, labA.tenantId).expect(200);
    expect(
      despues.body.items.some(
        (i: { serviceRequestId: string }) => i.serviceRequestId === ordenId,
      ),
    ).toBe(false);
  });
});
