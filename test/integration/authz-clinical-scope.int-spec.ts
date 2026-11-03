import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  bearer,
  camposObligatoriosDePaciente,
  TEST_ADMIN_ID,
  type TestContext,
} from './harness';
import { SEED } from '../../src/common';

/**
 * AUTHZ-M01 · los accesos clínicos no enlazan un paciente ajeno al tenant del actor.
 *
 * Contra la base real: un paciente sin vínculo con el tenant activo (su cuenta no
 * es miembro de él por autorregistro ni reservó turno por sí misma allí) responde 404
 * `AUTHZ_PATIENT_OUT_OF_SCOPE` en el acceso clínico, en el break-the-glass y en la
 * relación asistencial, y no deja ni grant, ni sesión de emergencia, ni relación.
 * Un paciente con vínculo (el autorregistro crea la membresía) sigue funcionando.
 */
describe('AUTHZ-M01 · alcance de tenant de las bases de acceso (integración)', () => {
  let ctx: TestContext;
  let campos: Awaited<ReturnType<typeof camposObligatoriosDePaciente>>;
  const password = 'S3cret-passw0rd';
  const marca = randomUUID().slice(0, 8);
  const http = () => request(ctx.app.getHttpServer());
  const admin = () => bearer(ctx.adminToken);
  const sql = <T = Record<string, unknown>>(
    text: string,
    params: unknown[] = [],
  ): Promise<T[]> =>
    ctx.orm.em.fork().getConnection().execute<T[]>(text, params);

  function claims(bruto: string): Record<string, unknown> {
    const [, cuerpo] = bruto.split('.');
    return JSON.parse(Buffer.from(cuerpo, 'base64url').toString('utf8'));
  }

  async function registrarPaciente(etiqueta: string) {
    const nationalId = `M01-${etiqueta}-${marca}`;
    await http()
      .post('/iam/auth/register-patient')
      .send({
        ...campos,
        nationalId,
        password,
        displayName: `Paciente ${etiqueta}`,
        email: `m01-${etiqueta}-${marca}@example.test`,
      })
      .expect(201);
    const login = await http()
      .post('/iam/auth/login')
      .send({ nationalId, password })
      .expect(200);
    const token = login.body.accessToken as string;
    return {
      token,
      patientProfileId: claims(token)['pid'] as string,
      userId: claims(token)['sub'] as string,
    };
  }

  const validTo = () => new Date(Date.now() + 3600_000).toISOString();
  let propio: Awaited<ReturnType<typeof registrarPaciente>>;
  let ajeno: Awaited<ReturnType<typeof registrarPaciente>>;

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    campos = await camposObligatoriosDePaciente(ctx);
    propio = await registrarPaciente('propio');
    ajeno = await registrarPaciente('ajeno');
    // El paciente «ajeno» deja de pertenecer al tenant activo: el modelo no guarda
    // el tenant del paciente, su vínculo es la membresía de su cuenta.
    await sql('delete from directory.tenant_memberships where user_id = ?', [
      ajeno.userId,
    ]);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  async function conteos(patientProfileId: string) {
    const [grants] = await sql<{ n: string }>(
      'select count(*)::text as n from authz.clinical_access_grants where patient_profile_id = ?',
      [patientProfileId],
    );
    const [sesiones] = await sql<{ n: string }>(
      'select count(*)::text as n from authz.break_glass_sessions where patient_ref_id = ?',
      [patientProfileId],
    );
    const [relaciones] = await sql<{ n: string }>(
      'select count(*)::text as n from authz.care_relationships where patient_profile_id = ?',
      [patientProfileId],
    );
    return {
      grants: Number(grants.n),
      sesiones: Number(sesiones.n),
      relaciones: Number(relaciones.n),
    };
  }

  it('correcto: concede acceso sobre un paciente del tenant', async () => {
    const res = await http()
      .post(`/authz/patients/${propio.patientProfileId}/clinical-access-grants`)
      .set(admin())
      .send({
        grantedUserId: TEST_ADMIN_ID,
        tenantId: SEED.tenantId,
        purposeOfUse: 'TREATMENT',
        accessLevel: 'READ',
        validTo: validTo(),
      })
      .expect(201);
    expect(res.body.status).toBe('ACTIVE');
  });

  it('error: un encuentro que no es del paciente responde 404 AUTHZ_ENCOUNTER_PATIENT_MISMATCH y no crea el acceso', async () => {
    const antes = await conteos(propio.patientProfileId);
    const res = await http()
      .post(`/authz/patients/${propio.patientProfileId}/break-the-glass`)
      .set(admin())
      .send({
        tenantId: SEED.tenantId,
        justification: 'Paciente inconsciente en urgencias, sin acompañante',
        encounterId: randomUUID(),
      })
      .expect(404);
    expect(res.body.reason).toBe('AUTHZ_ENCOUNTER_PATIENT_MISMATCH');
    expect(await conteos(propio.patientProfileId)).toEqual(antes);
  });

  it('falla catalogada: break-the-glass sobre un paciente ajeno al tenant responde 404 AUTHZ_PATIENT_OUT_OF_SCOPE y no deja grant ni sesión', async () => {
    const res = await http()
      .post(`/authz/patients/${ajeno.patientProfileId}/break-the-glass`)
      .set(admin())
      .send({
        tenantId: SEED.tenantId,
        justification: 'Paciente inconsciente en urgencias, sin acompañante',
      })
      .expect(404);
    expect(res.body.code).toBe('NOT_FOUND');
    expect(res.body.reason).toBe('AUTHZ_PATIENT_OUT_OF_SCOPE');
    expect(res.body.details).toBeUndefined();
    expect(await conteos(ajeno.patientProfileId)).toEqual({
      grants: 0,
      sesiones: 0,
      relaciones: 0,
    });
  });

  it('un paciente ajeno y uno inexistente responden idéntico', async () => {
    const cuerpo = {
      grantedUserId: TEST_ADMIN_ID,
      tenantId: SEED.tenantId,
      purposeOfUse: 'TREATMENT',
      accessLevel: 'READ',
      validTo: validTo(),
    };
    const delAjeno = await http()
      .post(`/authz/patients/${ajeno.patientProfileId}/clinical-access-grants`)
      .set(admin())
      .send(cuerpo)
      .expect(404);
    const inexistente = await http()
      .post(`/authz/patients/${randomUUID()}/clinical-access-grants`)
      .set(admin())
      .send(cuerpo)
      .expect(404);
    expect(delAjeno.body.message).toBe(inexistente.body.message);
    expect(delAjeno.body.reason).toBe(inexistente.body.reason);
    expect((await conteos(ajeno.patientProfileId)).grants).toBe(0);
  });

  it('error: una relación asistencial o una representación sobre un paciente ajeno responden 404 y no se crean', async () => {
    await http()
      .post('/authz/care-relationships')
      .set(admin())
      .send({
        tenantId: SEED.tenantId,
        patientProfileId: ajeno.patientProfileId,
        practitionerProfileId: randomUUID(),
        relationshipType: 'TREATING',
      })
      .expect(404);
    await http()
      .post('/authz/legal-representations')
      .set(admin())
      .send({
        tenantId: SEED.tenantId,
        patientProfileId: ajeno.patientProfileId,
        representativeUserId: TEST_ADMIN_ID,
        representationType: 'PARENT',
      })
      .expect(404);
    expect((await conteos(ajeno.patientProfileId)).relaciones).toBe(0);
  });
});
