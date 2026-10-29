import { randomUUID } from 'node:crypto';
import { CONCEPTS, SEED } from '../../src/common';
import { CLIN } from '../../src/modules/clinical/clinical.concepts';
import { PERFORMER_SELECTION_CONCEPTS } from '../../src/modules/clinical/performer-selection';
import { DIAG } from '../../src/modules/diagnostics/diagnostics.concepts';
import { PRAC } from '../../src/modules/practice/practice.concepts';
import { PROF } from '../../src/modules/profiles/profiles.concepts';
import { bearer, bootstrapTestApp, type TestContext } from './harness';
import {
  PASSWORD,
  as,
  createPatient,
  createSpace,
  createUnit,
  toolbox,
  type InfraOrg,
} from './infrastructure-f3.fixtures';

/**
 * F5b · laboratorio: puntos de toma de muestras (CONTRATO-F2-F5 F5b), contra la base
 * real y por HTTP real.
 *
 * Por endpoint: un caso permitido y casos que fallan cerrado (sede de otro tenant: 404;
 * punto que la sede no ofrece, de otra sede o de otro tenant: 422 `COLLECTION_POINT_INVALID`
 * uniforme; punto sin sede: 422). Incluye el flujo «en este centro» (la orden la emite una
 * organización y sugiere la sede de otra) y el flujo completo con recarga: bloquear un
 * punto lo saca de las sugerencias, la orden queda con su punto, la toma lo registra y la
 * bandeja del laboratorio lo muestra tras recargar.
 */
describe('Infraestructura F5b · laboratorio y puntos de toma', () => {
  let ctx: TestContext;
  const suffix = randomUUID().slice(0, 8);
  let http: ReturnType<typeof toolbox>['http'];
  let sql: ReturnType<typeof toolbox>['sql'];

  let labA: InfraOrg;
  let labB: InfraOrg;
  let siteA2: string;
  let box1: string;
  let box2: string;
  let consulting: string;
  let boxOtherSite: string;
  let boxB: string;
  let patient: string;
  let seq = 0;

  const owner = (org: InfraOrg) => as(org.token, org.tenantId);
  /** La clínica que emite las órdenes (tenant por defecto de la plataforma). */
  const clinic = () => as(ctx.adminToken, SEED.tenantId);

  /** Alta de un laboratorio (centro de diagnóstico) con su práctica y su sede. */
  async function registerLab(letter: string): Promise<InfraOrg> {
    const org: InfraOrg = {
      letter,
      email: `f5b-${letter.toLowerCase()}-${suffix}@example.test`,
      tenantId: '',
      token: '',
      practiceId: '',
      siteId: '',
    };
    const alta = await http()
      .post('/iam/auth/register-organization')
      .send({
        organization: {
          code: `F5B_${letter}_${suffix.toUpperCase()}`,
          legalName: `Laboratorio F5B ${letter} ${suffix}`,
          tenantType: 'DIAGNOSTIC_CENTER',
          countryConceptId: CONCEPTS.COUNTRY_BO,
          jurisdictionConceptId: PROF.JURISDICTION_SEDES_SANTA_CRUZ,
        },
        owner: {
          email: org.email,
          password: PASSWORD,
          name: 'Dueña',
          lastName: letter,
        },
      })
      .expect(201);
    org.tenantId = alta.body.tenantId;
    org.token = (
      await http()
        .post('/iam/auth/login')
        .send({ email: org.email, password: PASSWORD })
        .expect(200)
    ).body.accessToken;
    org.practiceId = (
      await http()
        .post('/practices')
        .set(bearer(ctx.adminToken))
        .send({
          tenantId: org.tenantId,
          code: `F5B-PRACT-${letter}-${suffix}`,
          name: `Laboratorio ${letter}`,
          timeZone: 'America/La_Paz',
        })
        .expect(201)
    ).body.id;
    org.siteId = (
      await http()
        .post(`/practices/${org.practiceId}/sites`)
        .set(owner(org))
        .send({ code: `F5B-SEDE-${letter}-${suffix}`, name: `Sede ${letter}` })
        .expect(201)
    ).body.id;
    return org;
  }

  /** La sede ofrece el procedimiento con precio (lo que exige la orden para sugerirla). */
  async function offerLabService(org: InfraOrg, siteId: string): Promise<void> {
    const catalog = randomUUID();
    await sql(
      `insert into billing.service_catalog
         (id, practice_id, code, name, default_price, is_active, created_at, updated_at)
       values (?, ?, ?, ?, 10, true, now(), now())`,
      [catalog, org.practiceId, `LAB-${catalog.slice(0, 8)}`, 'Hemograma'],
    );
    await sql(
      `insert into practice.healthcare_services
         (id, practice_id, practice_site_id, service_concept_id, service_catalog_id,
          status_concept_id, created_at, updated_at)
       values (gen_random_uuid(), ?, ?, ?, ?, ?, now(), now())`,
      [
        org.practiceId,
        siteId,
        CLIN.SERVICE_REQUEST_CATEGORY_LAB,
        catalog,
        PRAC.SERVICE_ACTIVE,
      ],
    );
    await sql(
      `update practice.practice_sites set status_concept_id = ? where id = ?`,
      [PRAC.SITE_ACTIVE, siteId],
    );
  }

  async function mkPoint(
    org: InfraOrg,
    name: string,
    fn = 'SPACE_FN_SAMPLE_COLLECTION',
    extra: Record<string, unknown> = {},
  ): Promise<string> {
    seq += 1;
    return (
      await createSpace(ctx, org, {
        code: `P${seq}-${suffix}`,
        name,
        formCode: 'LOC_FORM_ROOM',
        functionCode: fn,
        ...extra,
      })
    ).id;
  }

  const block = async (org: InfraOrg, id: string) => {
    const state = await http()
      .get(`/care-spaces/${id}/operational-state`)
      .set(owner(org))
      .expect(200);
    return http()
      .post(`/care-spaces/${id}/availability`)
      .set(owner(org))
      .set({ 'If-Match-Ops': `"${state.body.cell.opsVersion}"` })
      .send({
        action: 'block',
        kindCode: 'BLOCK_ADMIN',
        reasonCode: 'BLOCK_RSN_ADMIN_DECISION',
      })
      .expect(200);
  };
  const unblock = async (org: InfraOrg, id: string) => {
    const state = await http()
      .get(`/care-spaces/${id}/operational-state`)
      .set(owner(org))
      .expect(200);
    return http()
      .post(`/care-spaces/${id}/availability`)
      .set(owner(org))
      .set({ 'If-Match-Ops': `"${state.body.cell.opsVersion}"` })
      .send({ action: 'unblock' })
      .expect(200);
  };

  const orderBody = (extra: Record<string, unknown> = {}) => ({
    custodianTenantId: SEED.tenantId,
    patientProfileId: patient,
    codeConceptId: CLIN.SERVICE_REQUEST_CATEGORY_LAB,
    categoryConceptId: CLIN.SERVICE_REQUEST_CATEGORY_LAB,
    performerSelectionConceptId: PERFORMER_SELECTION_CONCEPTS.ORGANIZATION,
    suggestedPracticeSiteId: labA.siteId,
    ...extra,
  });
  // Un paciente nuevo por orden: dos órdenes iguales del mismo paciente son un duplicado.
  const sendOrder = async (extra: Record<string, unknown>) =>
    http()
      .post('/clinical/service-requests')
      .set(clinic())
      .send(
        orderBody({
          patientProfileId: await createPatient(ctx, {
            name: `Paciente F5B ${(seq += 1)}`,
            gender: 'FEMALE',
            birthDate: '1991-02-03',
          }),
          ...extra,
        }),
      );
  const placeOrder = (extra: Record<string, unknown> = {}) => {
    const sent = sendOrder(extra);
    return Object.assign(sent, {
      expect: async (status: number) => {
        const res = await sent;
        expect({ status: res.status, body: res.body }).toMatchObject({
          status,
        });
        return res;
      },
    });
  };

  const pointsUrl = (siteId: string) =>
    `/sites/${siteId}/sample-collection-points`;
  const pointIds = async (org: InfraOrg, siteId: string) =>
    (await http().get(pointsUrl(siteId)).set(owner(org)).expect(200)).body.map(
      (p: any) => p.careSpace.id,
    );

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    ({ http, sql } = toolbox(ctx));
    labA = await registerLab('A');
    labB = await registerLab('B');
    const unitLab = await createUnit(
      ctx,
      labA,
      `UN-LAB-${suffix}`,
      'Laboratorio',
    );
    box1 = await mkPoint(labA, 'Box 1', 'SPACE_FN_SAMPLE_COLLECTION', {
      clinicalUnitId: unitLab,
    });
    box2 = await mkPoint(labA, 'Box 2');
    consulting = await mkPoint(labA, 'Consultorio', 'SPACE_FN_CONSULTING_ROOM');
    boxB = await mkPoint(labB, 'Box B');
    siteA2 = (
      await http()
        .post(`/practices/${labA.practiceId}/sites`)
        .set(owner(labA))
        .send({ code: `F5B-SEDE-A2-${suffix}`, name: 'Sede A2' })
        .expect(201)
    ).body.id;
    seq += 1;
    boxOtherSite = (
      await http()
        .post(`/sites/${siteA2}/care-spaces`)
        .set(owner(labA))
        .send({
          activate: true,
          code: `PA2-${seq}-${suffix}`,
          name: 'Box A2',
          formCode: 'LOC_FORM_ROOM',
          functionCode: 'SPACE_FN_SAMPLE_COLLECTION',
        })
        .expect(201)
    ).body.id;
    await offerLabService(labA, labA.siteId);
    await offerLabService(labA, siteA2);
    await offerLabService(labB, labB.siteId);
    patient = await createPatient(ctx, {
      name: 'Paciente sintético F5B',
      gender: 'FEMALE',
      birthDate: '1991-02-03',
    });
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  // ------------------------------------------------ GET puntos de toma
  describe('GET /sites/:siteId/sample-collection-points', () => {
    it('ofrece los puntos de toma de la sede, con su estado de F2 y sin pacientes', async () => {
      const res = await http()
        .get(pointsUrl(labA.siteId))
        .set(owner(labA))
        .expect(200);
      expect(res.body.map((p: any) => p.careSpace.id).sort()).toEqual(
        [box1, box2].sort(),
      );
      const first = res.body.find((p: any) => p.careSpace.id === box1);
      expect(first).toMatchObject({
        careSpace: { name: 'Box 1' },
        unit: { name: 'Laboratorio' },
        cell: { availability: { code: 'SPACE_OP_AVAILABLE' } },
      });
      expect(JSON.stringify(res.body)).not.toMatch(/patient|encounter/i);
      // el consultorio y el punto de la otra sede no son del listado
      expect(res.body.map((p: any) => p.careSpace.id)).not.toContain(
        consulting,
      );
      expect(res.body.map((p: any) => p.careSpace.id)).not.toContain(
        boxOtherSite,
      );
    });

    it('un punto bloqueado deja de ofrecerse y vuelve al desbloquear (con recarga)', async () => {
      await block(labA, box2);
      expect(await pointIds(labA, labA.siteId)).toEqual([box1]);
      await unblock(labA, box2);
      expect((await pointIds(labA, labA.siteId)).sort()).toEqual(
        [box1, box2].sort(),
      );
    });

    it('fail-closed: la sede de otro tenant o inexistente responde el mismo 404', async () => {
      const foreign = await http().get(pointsUrl(labB.siteId)).set(owner(labA));
      const missing = await http()
        .get(pointsUrl(randomUUID()))
        .set(owner(labA));
      expect(foreign.status).toBe(404);
      expect(missing.status).toBe(404);
      expect(foreign.body.reason).toBe(missing.body.reason);
      expect(JSON.stringify(foreign.body)).not.toContain('Box B');
    });

    it('sin sesión: 401', async () => {
      await http().get(pointsUrl(labA.siteId)).expect(401);
    });
  });

  // ---------------------------------------------------- orden (suggestedCareSpaceId)
  describe('POST /clinical/service-requests con punto de toma', () => {
    it('un punto explícito válido queda en la orden, con su nombre, su evento y recarga', async () => {
      const res = await placeOrder({ suggestedCareSpaceId: box2 }).expect(201);
      expect(res.body).toMatchObject({
        suggestedPracticeSiteId: labA.siteId,
        suggestedCareSpaceId: box2,
        suggestedCareSpaceName: 'Box 2',
      });
      const [row] = await sql(
        `select suggested_practice_site_id, suggested_care_space_id
           from clinical.service_requests where id = ?`,
        [res.body.id],
      );
      expect(row).toEqual({
        suggested_practice_site_id: labA.siteId,
        suggested_care_space_id: box2,
      });
      const events = await sql(
        `select payload_json from messaging.domain_events
          where aggregate_id = ? and event_type = 'clinical.service_request.collection_point_suggested'`,
        [res.body.id],
      );
      expect(events).toHaveLength(1);
      expect(events[0].payload_json).toMatchObject({
        suggestedCareSpaceId: box2,
        source: 'EXPLICIT',
      });
    });

    it('sin punto, una orden de laboratorio con sede sugiere el primero disponible; si se bloquea, el siguiente', async () => {
      const first = await placeOrder().expect(201);
      expect(first.body.suggestedCareSpaceId).toBe(box1);
      await block(labA, box1);
      try {
        const second = await placeOrder().expect(201);
        expect(second.body.suggestedCareSpaceId).toBe(box2);
        const events = await sql(
          `select payload_json from messaging.domain_events
            where aggregate_id = ? and event_type = 'clinical.service_request.collection_point_suggested'`,
          [second.body.id],
        );
        expect(events[0].payload_json.source).toBe('DEFAULT');
      } finally {
        await unblock(labA, box1);
      }
    });

    it('una orden que no es de laboratorio no recibe punto por defecto', async () => {
      const res = await placeOrder({
        categoryConceptId: CLIN.SERVICE_REQUEST_CATEGORY_OTHER,
        codeConceptId: CLIN.SERVICE_REQUEST_CATEGORY_LAB,
      }).expect(201);
      expect(res.body.suggestedCareSpaceId).toBeNull();
    });

    it('un punto bloqueado no se sugiere: 422 COLLECTION_POINT_INVALID', async () => {
      await block(labA, box2);
      try {
        const res = await placeOrder({ suggestedCareSpaceId: box2 });
        expect(res.status).toBe(422);
        expect(res.body.reason).toBe('COLLECTION_POINT_INVALID');
      } finally {
        await unblock(labA, box2);
      }
    });

    it('otra función, otra sede, otro tenant o inexistente: la misma 422, sin detalles', async () => {
      const bodies = [];
      for (const id of [consulting, boxOtherSite, boxB, randomUUID()]) {
        const res = await placeOrder({ suggestedCareSpaceId: id });
        expect(res.status).toBe(422);
        expect(res.body.reason).toBe('COLLECTION_POINT_INVALID');
        bodies.push({ message: res.body.message, details: res.body.details });
      }
      expect(new Set(bodies.map((b) => JSON.stringify(b))).size).toBe(1);
      expect(bodies[0].details).toBeUndefined();
    });

    it('un punto sin sede sugerida: 422 COLLECTION_POINT_REQUIRES_SITE', async () => {
      const res = await http()
        .post('/clinical/service-requests')
        .set(clinic())
        .send({
          custodianTenantId: SEED.tenantId,
          patientProfileId: patient,
          codeConceptId: CLIN.SERVICE_REQUEST_CATEGORY_LAB,
          suggestedCareSpaceId: box1,
        });
      expect(res.status).toBe(422);
      expect(res.body.reason).toBe('COLLECTION_POINT_REQUIRES_SITE');
    });

    it('«en este centro»: la clínica sugiere la sede de otro laboratorio y el par se autoriza', async () => {
      const ok = await placeOrder({
        suggestedPracticeSiteId: labB.siteId,
        suggestedCareSpaceId: boxB,
      }).expect(201);
      expect(ok.body).toMatchObject({ suggestedCareSpaceId: boxB });
      // el punto de A con la sede de B no es un par
      const crossed = await placeOrder({
        suggestedPracticeSiteId: labB.siteId,
        suggestedCareSpaceId: box1,
      });
      expect(crossed.status).toBe(422);
      expect(crossed.body.reason).toBe('COLLECTION_POINT_INVALID');
    });

    it('la base es la red: un punto sin sede no entra aunque la API no lo hubiera visto', async () => {
      await expect(
        sql(
          `insert into clinical.service_requests
             (id, custodian_tenant_id, patient_profile_id, code_concept_id, status_concept_id,
              suggested_care_space_id, created_at, updated_at)
           values (gen_random_uuid(), ?, ?, ?, ?, ?, now(), now())`,
          [
            SEED.tenantId,
            patient,
            CLIN.SERVICE_REQUEST_CATEGORY_LAB,
            CLIN.SERVICE_REQUEST_ACTIVE,
            box1,
          ],
        ),
      ).rejects.toMatchObject({ code: '23514' });
    });
  });

  // ------------------------------------------------------------- la toma
  describe('POST /diagnostics/specimens con sede y punto de toma', () => {
    const specimen = (extra: Record<string, unknown>) =>
      http()
        .post('/diagnostics/specimens')
        .set(owner(labA))
        .send({
          patientProfileId: patient,
          specimenTypeConceptId: DIAG.SPECIMEN_TYPE_BLOOD_VENOUS,
          ...extra,
        });

    it('registra la toma con la sede y el punto, y queda en la base', async () => {
      const res = await specimen({
        collectionSiteId: labA.siteId,
        collectionCareSpaceId: box1,
      }).expect(201);
      const [event] = await sql(
        `select collection_site_id, collection_care_space_id, event_type_concept_id
           from diagnostics.specimen_collection_events where specimen_id = ?`,
        [res.body.id],
      );
      expect(event).toEqual({
        collection_site_id: labA.siteId,
        collection_care_space_id: box1,
        event_type_concept_id: DIAG.SPECIMEN_COLLECTED,
      });
    });

    it('sin sede ni punto no se escribe evento de toma', async () => {
      const res = await specimen({}).expect(201);
      const events = await sql(
        `select 1 from diagnostics.specimen_collection_events where specimen_id = ?`,
        [res.body.id],
      );
      expect(events).toHaveLength(0);
    });

    it('lo que ocurrió se registra aunque el punto esté hoy bloqueado', async () => {
      await block(labA, box2);
      try {
        await specimen({
          collectionSiteId: labA.siteId,
          collectionCareSpaceId: box2,
        }).expect(201);
      } finally {
        await unblock(labA, box2);
      }
    });

    it('fail-closed: sede de otro tenant 404; punto ajeno, de otra función o de otra sede 422; punto sin sede 422', async () => {
      const foreignSite = await specimen({ collectionSiteId: labB.siteId });
      expect(foreignSite.status).toBe(404);
      const before = await sql(
        `select count(*)::int as n from diagnostics.specimens where patient_profile_id = ?`,
        [patient],
      );
      for (const id of [boxB, consulting, boxOtherSite, randomUUID()]) {
        const res = await specimen({
          collectionSiteId: labA.siteId,
          collectionCareSpaceId: id,
        });
        expect(res.status).toBe(422);
        expect(res.body.reason).toBe('COLLECTION_POINT_INVALID');
      }
      const noSite = await specimen({ collectionCareSpaceId: box1 });
      expect(noSite.status).toBe(422);
      expect(noSite.body.reason).toBe('COLLECTION_POINT_REQUIRES_SITE');
      const after = await sql(
        `select count(*)::int as n from diagnostics.specimens where patient_profile_id = ?`,
        [patient],
      );
      expect(after[0].n).toBe(before[0].n);
    });

    it('el laboratorio B no registra una toma en la sede de A', async () => {
      const res = await http()
        .post('/diagnostics/specimens')
        .set(owner(labB))
        .send({
          patientProfileId: patient,
          specimenTypeConceptId: DIAG.SPECIMEN_TYPE_BLOOD_VENOUS,
          collectionSiteId: labA.siteId,
          collectionCareSpaceId: box1,
        });
      expect(res.status).toBe(404);
    });

    it('la base es la red: una toma con punto y sin sede no entra', async () => {
      const res = await specimen({}).expect(201);
      await expect(
        sql(
          `insert into diagnostics.specimen_collection_events
             (id, specimen_id, occurred_at, event_type_concept_id, collection_care_space_id, created_at)
           values (gen_random_uuid(), ?, now(), ?, ?, now())`,
          [res.body.id, DIAG.SPECIMEN_COLLECTED, box1],
        ),
      ).rejects.toMatchObject({ code: '23514' });
    });
  });

  // -------------------------------------------- bandeja del laboratorio, con recarga
  describe('POST /diagnostics/service-requests/inbox · columna y filtro «Punto de toma»', () => {
    let withPoint: string;
    let withOtherPoint: string;
    let crossTenant: string;

    const inbox = (org: InfraOrg, body: Record<string, unknown> = {}) =>
      http()
        .post('/diagnostics/service-requests/inbox')
        .set(owner(org))
        .send(body);

    beforeAll(async () => {
      const derive = (extra: Record<string, unknown>) =>
        placeOrder({ performerTenantId: labA.tenantId, ...extra }).expect(201);
      withPoint = (await derive({ suggestedCareSpaceId: box1 })).body.id;
      withOtherPoint = (await derive({ suggestedCareSpaceId: box2 })).body.id;
      // La clínica sugiere el punto del laboratorio B pero deriva la orden al A: el
      // punto no es de A, así que no se nombra en su bandeja.
      crossTenant = (
        await placeOrder({
          performerTenantId: labA.tenantId,
          suggestedPracticeSiteId: labB.siteId,
          suggestedCareSpaceId: boxB,
        }).expect(201)
      ).body.id;
    });

    it('la bandeja muestra el punto de cada orden tras recargar', async () => {
      const res = await inbox(labA).expect(200);
      const byId = (id: string) =>
        res.body.items.find((i: any) => i.serviceRequestId === id);
      expect(byId(withPoint)).toMatchObject({
        suggestedPracticeSiteId: labA.siteId,
        suggestedCareSpaceId: box1,
        suggestedCareSpaceName: 'Box 1',
      });
      expect(byId(withOtherPoint)).toMatchObject({
        suggestedCareSpaceName: 'Box 2',
      });
    });

    it('el punto de otra organización viaja sin nombre', async () => {
      const res = await inbox(labA).expect(200);
      const item = res.body.items.find(
        (i: any) => i.serviceRequestId === crossTenant,
      );
      expect(item.suggestedCareSpaceId).toBe(boxB);
      expect(item.suggestedCareSpaceName).toBeNull();
      expect(JSON.stringify(res.body)).not.toContain('Box B');
    });

    it('el filtro por punto devuelve solo las órdenes de ese punto', async () => {
      const res = await inbox(labA, { collectionPointId: box1 }).expect(200);
      const ids = res.body.items.map((i: any) => i.serviceRequestId);
      expect(ids).toContain(withPoint);
      expect(ids).not.toContain(withOtherPoint);
      expect(ids).not.toContain(crossTenant);
    });

    it('fail-closed: el laboratorio B no ve nada de A, ni filtrando por el punto de A', async () => {
      const res = await inbox(labB, { collectionPointId: box1 }).expect(200);
      expect(res.body.items).toEqual([]);
      const all = await inbox(labB).expect(200);
      expect(all.body.items.map((i: any) => i.serviceRequestId)).not.toContain(
        withPoint,
      );
    });
  });
});
