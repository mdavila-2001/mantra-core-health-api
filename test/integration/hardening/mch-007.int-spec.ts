import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  TEST_ADMIN_ID,
  bootstrapTestApp,
  bearer,
  ensureTestSession,
  type TestContext,
} from '../harness';
import { CONCEPTS, SEED, TokenService } from '../../../src/common';
import { CLIN } from '../../../src/modules/clinical/clinical.concepts';
import { AUTHZ } from '../../../src/modules/authz/authz.concepts';
import { PROF } from '../../../src/modules/profiles/profiles.concepts';

/**
 * MCH-007 · escribir en una historia clínica exige base de escritura sobre
 * ESE paciente, también en las rutas que llegan sólo con un id.
 *
 * Contra PostgreSQL y el PDP real: los grants viven en
 * `authz.clinical_access_grants` y el nivel `READ`/`WRITE` lo compara el PDP,
 * no un doble. Cada negativo cuenta filas después del 403: el código HTTP solo
 * no prueba que no se escribió nada.
 *
 * Cada profesional es una cuenta nueva por corrida (usuario, persona, perfil
 * profesional y vínculo cuenta↔persona), y cada uno tiene una sola base de
 * acceso, para que el resultado no dependa de otra.
 */
describe('MCH-007 · autorización de escritura clínica por paciente (integración)', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());
  const sufijo = randomUUID().slice(0, 8);
  const paciente = randomUUID();

  const sql = <T = Record<string, unknown>>(
    query: string,
    params: unknown[] = [],
  ): Promise<T[]> =>
    ctx.orm.em.fork().getConnection().execute<T[]>(query, params);

  interface Profesional {
    userId: string;
    profileId: string;
    token: string;
  }

  /** Cuenta profesional completa, sin ningún vínculo con el paciente. */
  async function profesional(etiqueta: string): Promise<Profesional> {
    const userId = randomUUID();
    const profileId = randomUUID();
    await sql(
      `insert into iam.users (id, status_concept_id, display_name, created_at, updated_at)
       values (?, ?, ?, now(), now())`,
      [userId, CONCEPTS.USER_ACTIVE, `MCH-007 ${etiqueta} ${sufijo}`],
    );
    await sql(
      `insert into profiles.persons (id, person_status_concept_id, created_at, updated_at)
       values (?, ?, now(), now())`,
      [profileId, CONCEPTS.STATE_ACTIVE],
    );
    await sql(
      `insert into profiles.health_practitioner_profiles
         (profile_id, practitioner_code, practitioner_category_concept_id,
          verification_status_concept_id, practice_status_concept_id, created_at, updated_at)
       values (?, ?, ?, ?, ?, now(), now())`,
      [
        profileId,
        `MCH007-${etiqueta}-${sufijo}`,
        CONCEPTS.STATE_ACTIVE,
        CONCEPTS.STATE_ACTIVE,
        CONCEPTS.STATE_ACTIVE,
      ],
    );
    await sql(
      `insert into profiles.person_account_links
         (id, person_id, user_id, link_type_concept_id, verification_status_concept_id,
          valid_from, status_concept_id, created_at, updated_at)
       values (gen_random_uuid(), ?, ?, ?, ?, now(), ?, now(), now())`,
      [
        profileId,
        userId,
        PROF.ACCOUNT_LINK_SELF,
        PROF.ACCOUNT_LINK_VERIFIED,
        PROF.ACCOUNT_LINK_ACTIVE,
      ],
    );
    const sid = `mch007-${etiqueta}-${sufijo}`;
    await ensureTestSession(ctx.orm, userId, sid);
    const token = ctx.app
      .get(TokenService)
      .signAccessToken(userId, sid, ['PRACTITIONER'], [SEED.tenantId], {
        practitionerProfileId: profileId,
      });
    return { userId, profileId, token };
  }

  async function concederAcceso(
    quien: Profesional,
    nivel: string,
  ): Promise<void> {
    await sql(
      `insert into authz.clinical_access_grants
         (id, patient_profile_id, granted_user_id, tenant_id, reason_concept_id,
          access_level_concept_id, state_concept_id, valid_from, valid_to,
          created_at, updated_at, created_by_user_id)
       values (gen_random_uuid(), ?, ?, ?, ?, ?, ?, now() - interval '1 hour',
               now() + interval '1 day', now(), now(), ?)`,
      [
        paciente,
        quien.userId,
        SEED.tenantId,
        AUTHZ.PURPOSE_TREATMENT,
        nivel,
        CONCEPTS.STATE_ACTIVE,
        TEST_ADMIN_ID,
      ],
    );
  }

  const conTenant = (token: string) => ({
    ...bearer(token),
    'X-Tenant-Id': SEED.tenantId,
  });

  function registrarCondicion(token: string, codeConceptId: string) {
    return http().post('/clinical/conditions').set(conTenant(token)).send({
      custodianTenantId: SEED.tenantId,
      patientProfileId: paciente,
      codeConceptId,
    });
  }

  async function condicionesConCodigo(codeConceptId: string) {
    const [fila] = await sql<{ n: string }>(
      `select count(*)::text as n from clinical.conditions
        where patient_profile_id = ? and code_concept_id = ?`,
      [paciente, codeConceptId],
    );
    return Number(fila.n);
  }

  let sinVinculo: Profesional;
  let conLectura: Profesional;
  let conEscritura: Profesional;
  let prescriptor: Profesional;

  beforeAll(async () => {
    ctx = await bootstrapTestApp();

    await sql(
      `insert into profiles.persons (id, person_status_concept_id, created_at, updated_at)
       values (?, ?, now(), now())`,
      [paciente, CONCEPTS.STATE_ACTIVE],
    );
    await sql(
      `insert into profiles.patient_profiles (profile_id, patient_code, created_at, updated_at)
       values (?, ?, now(), now())`,
      [paciente, `MCH007-${sufijo}`],
    );

    sinVinculo = await profesional('sin-vinculo');
    conLectura = await profesional('lectura');
    conEscritura = await profesional('escritura');
    prescriptor = await profesional('prescriptor');
    await concederAcceso(conLectura, AUTHZ.ACCESS_LEVEL_READ);
    await concederAcceso(conEscritura, AUTHZ.ACCESS_LEVEL_WRITE);
    await concederAcceso(prescriptor, AUTHZ.ACCESS_LEVEL_WRITE);
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  describe('alta por cuerpo', () => {
    it('AC01 · sin vínculo ni grant no registra una condición, y no queda fila', async () => {
      await registrarCondicion(
        sinVinculo.token,
        CLIN.CONDITION_CATEGORY_PROBLEM,
      ).expect(403);
      expect(await condicionesConCodigo(CLIN.CONDITION_CATEGORY_PROBLEM)).toBe(
        0,
      );
    });

    it('AC02 · un grant READ deja leer la historia pero no escribir en ella', async () => {
      await http()
        .get(`/clinical/patients/${paciente}/summary`)
        .set(conTenant(conLectura.token))
        .expect(200);

      await registrarCondicion(
        conLectura.token,
        CLIN.CONDITION_CATEGORY_PROBLEM,
      ).expect(403);
      expect(await condicionesConCodigo(CLIN.CONDITION_CATEGORY_PROBLEM)).toBe(
        0,
      );
    });

    it('un grant WRITE sí registra', async () => {
      await registrarCondicion(
        conEscritura.token,
        CLIN.CONDITION_CATEGORY_PROBLEM,
      ).expect(201);
      expect(await condicionesConCodigo(CLIN.CONDITION_CATEGORY_PROBLEM)).toBe(
        1,
      );
    });
  });

  describe('modificación por id', () => {
    it('AC03 · sin vínculo no cambia el estado de una condición ajena, y la fila no cambia', async () => {
      const alta = await registrarCondicion(
        conEscritura.token,
        CLIN.CONDITION_CATEGORY_DIAGNOSIS,
      ).expect(201);
      const conditionId = alta.body.id as string;

      await http()
        .post(`/clinical/conditions/${conditionId}/change-status`)
        .set(conTenant(sinVinculo.token))
        .send({
          newClinicalStatusConceptId: CLIN.CONDITION_INACTIVE,
          reasonText: 'intento sin vínculo',
        })
        .expect(403);

      await http()
        .post(`/clinical/conditions/${conditionId}/change-status`)
        .set(conTenant(conLectura.token))
        .send({
          newClinicalStatusConceptId: CLIN.CONDITION_INACTIVE,
          reasonText: 'intento con grant de lectura',
        })
        .expect(403);

      const [fila] = await sql<{ clinical_status_concept_id: string }>(
        'select clinical_status_concept_id from clinical.conditions where id = ?',
        [conditionId],
      );
      expect(fila.clinical_status_concept_id).toBe(CLIN.CONDITION_ACTIVE);
    });

    it('AC02 · WRITE no habilita firmar la receta de otro profesional', async () => {
      const alta = await http()
        .post('/clinical/medication-requests')
        .set(conTenant(prescriptor.token))
        .send({
          custodianTenantId: SEED.tenantId,
          patientProfileId: paciente,
          medicationConceptId: CLIN.CONDITION_CATEGORY_PROBLEM,
          prescriberProfileId: prescriptor.profileId,
          doseText: '1 comprimido',
        })
        .expect(201);
      const requestId = alta.body.id as string;

      await http()
        .post(`/clinical/medication-requests/${requestId}/sign`)
        .set(conTenant(conEscritura.token))
        .send({})
        .expect(403);

      const [antes] = await sql<{ signed_at: Date | null }>(
        'select signed_at from clinical.medication_requests where id = ?',
        [requestId],
      );
      expect(antes.signed_at).toBeNull();

      // El prescriptor sí la firma: la regla no bloquea al dueño.
      await http()
        .post(`/clinical/medication-requests/${requestId}/sign`)
        .set(conTenant(prescriptor.token))
        .send({})
        .expect(200);
      const [despues] = await sql<{ signed_by_user_id: string }>(
        'select signed_by_user_id from clinical.medication_requests where id = ?',
        [requestId],
      );
      expect(despues.signed_by_user_id).toBe(prescriptor.userId);
    });
  });
});
