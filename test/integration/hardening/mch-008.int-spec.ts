import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  FIX,
  TEST_ADMIN_ID,
  bootstrapTestApp,
  bearer,
  type TestContext,
} from '../harness';
import { CONCEPTS, SEED } from '../../../src/common';
import { CLIN } from '../../../src/modules/clinical/clinical.concepts';

/**
 * MCH-008 · una observación no puede colgar del encuentro o la orden de otro
 * paciente, ni de otro tenant, aunque cada id exista.
 *
 * La unitaria del servicio fija la decisión con repositorios simulados; acá se
 * comprueba contra PostgreSQL que la FK sola lo habría aceptado y que, con la
 * validación, **no queda ninguna fila escrita**. Un 404 no alcanza como prueba:
 * se cuenta en `clinical.observations`.
 *
 * Los fixtures llevan ids nuevos por corrida, así que cada ejecución es
 * independiente y no se borra nada al terminar.
 */
describe('MCH-008 · coherencia de la observación (integración)', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());
  const sufijo = randomUUID().slice(0, 8);

  const pacienteA = FIX.patPerson;
  const pacienteB = randomUUID();
  let otroTenant: string;

  const encuentroA = randomUUID();
  const encuentroB = randomUUID();
  const encuentroAEnOtroTenant = randomUUID();
  const ordenB = randomUUID();
  const ordenAEnOtroTenant = randomUUID();
  const ordenADerivadaAqui = randomUUID();

  const sql = <T = Record<string, unknown>>(
    query: string,
    params: unknown[] = [],
  ): Promise<T[]> =>
    ctx.orm.em.fork().getConnection().execute<T[]>(query, params);

  async function encuentro(id: string, paciente: string, tenant: string) {
    await sql(
      `insert into clinical.encounters
         (id, patient_profile_id, tenant_id, status_concept_id, created_at, updated_at, created_by_user_id)
       values (?, ?, ?, ?, now(), now(), ?)`,
      [id, paciente, tenant, CLIN.ENCOUNTER_IN_PROGRESS, TEST_ADMIN_ID],
    );
  }

  async function orden(
    id: string,
    paciente: string,
    custodio: string,
    ejecutor: string | null,
  ) {
    await sql(
      `insert into clinical.service_requests
         (id, custodian_tenant_id, patient_profile_id, code_concept_id,
          status_concept_id, performer_tenant_id, created_at, updated_at, created_by_user_id)
       values (?, ?, ?, ?, ?, ?, now(), now(), ?)`,
      [
        id,
        custodio,
        paciente,
        CLIN.SERVICE_REQUEST_CATEGORY_LAB,
        CLIN.SERVICE_REQUEST_ACTIVE,
        ejecutor,
        TEST_ADMIN_ID,
      ],
    );
  }

  function registrar(referencias: {
    encounterId?: string;
    basedOnServiceRequestId?: string;
  }) {
    return http()
      .post('/clinical/observations')
      .set(bearer(ctx.adminToken))
      .set('X-Tenant-Id', SEED.tenantId)
      .send({
        custodianTenantId: SEED.tenantId,
        patientProfileId: pacienteA,
        codeConceptId: CLIN.SERVICE_REQUEST_CATEGORY_LAB,
        valueText: `mch008-${sufijo}`,
        ...referencias,
      });
  }

  async function observacionesQueApuntanA(columna: string, id: string) {
    const [fila] = await sql<{ n: string }>(
      `select count(*)::text as n from clinical.observations where ${columna} = ?`,
      [id],
    );
    return Number(fila.n);
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();

    const [tenant] = await sql<{ id: string }>(
      'select id from directory.tenants where id <> ? order by id limit 1',
      [SEED.tenantId],
    );
    otroTenant = tenant.id;

    await sql(
      `insert into profiles.persons (id, person_status_concept_id, created_at, updated_at)
       values (?, ?, now(), now())`,
      [pacienteB, CONCEPTS.STATE_ACTIVE],
    );
    await sql(
      `insert into profiles.patient_profiles (profile_id, patient_code, created_at, updated_at)
       values (?, ?, now(), now())`,
      [pacienteB, `MCH008-${sufijo}`],
    );

    await encuentro(encuentroA, pacienteA, SEED.tenantId);
    await encuentro(encuentroB, pacienteB, SEED.tenantId);
    await encuentro(encuentroAEnOtroTenant, pacienteA, otroTenant);
    await orden(ordenB, pacienteB, SEED.tenantId, null);
    await orden(ordenAEnOtroTenant, pacienteA, otroTenant, null);
    await orden(ordenADerivadaAqui, pacienteA, otroTenant, SEED.tenantId);
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  it('AC01 · rechaza la observación de A con el encuentro de B, sin escribir', async () => {
    await registrar({ encounterId: encuentroB }).expect(404);
    expect(await observacionesQueApuntanA('encounter_id', encuentroB)).toBe(0);
  });

  it('AC01 · rechaza la observación de A con la orden de B, sin escribir', async () => {
    await registrar({ basedOnServiceRequestId: ordenB }).expect(404);
    expect(
      await observacionesQueApuntanA('based_on_service_request_id', ordenB),
    ).toBe(0);
  });

  it('AC02 · rechaza el encuentro de A en otro tenant, sin escribir', async () => {
    await registrar({ encounterId: encuentroAEnOtroTenant }).expect(404);
    expect(
      await observacionesQueApuntanA('encounter_id', encuentroAEnOtroTenant),
    ).toBe(0);
  });

  it('AC02 · rechaza la orden de A de otro tenant que no la deriva acá, sin escribir', async () => {
    await registrar({ basedOnServiceRequestId: ordenAEnOtroTenant }).expect(
      404,
    );
    expect(
      await observacionesQueApuntanA(
        'based_on_service_request_id',
        ordenAEnOtroTenant,
      ),
    ).toBe(0);
  });

  it('AC03 · una orden derivada a este tenant se registra y conserva origen, custodio y paciente', async () => {
    const res = await registrar({
      encounterId: encuentroA,
      basedOnServiceRequestId: ordenADerivadaAqui,
    }).expect(201);

    const [fila] = await sql<{
      custodian_tenant_id: string;
      patient_profile_id: string;
      encounter_id: string;
      based_on_service_request_id: string;
    }>(
      `select custodian_tenant_id, patient_profile_id, encounter_id, based_on_service_request_id
         from clinical.observations where id = ?`,
      [res.body.id],
    );
    expect(fila).toEqual({
      custodian_tenant_id: SEED.tenantId,
      patient_profile_id: pacienteA,
      encounter_id: encuentroA,
      based_on_service_request_id: ordenADerivadaAqui,
    });

    // La orden de origen sigue siendo de su custodio: registrar el resultado
    // no la reasigna.
    const [ordenDespues] = await sql<{
      custodian_tenant_id: string;
      patient_profile_id: string;
    }>(
      'select custodian_tenant_id, patient_profile_id from clinical.service_requests where id = ?',
      [ordenADerivadaAqui],
    );
    expect(ordenDespues).toEqual({
      custodian_tenant_id: otroTenant,
      patient_profile_id: pacienteA,
    });
  });
});
