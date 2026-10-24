import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  bearer,
  type TestContext,
  identidadProfesional,
} from './harness';

/**
 * FX-17 · sello SHA-256 del cierre del encuentro y su PDF oficial (C.4).
 *
 * ## Qué se está protegiendo
 *
 * `POST /clinical/encounters/:id/close` calcula y persiste un hash del
 * contenido del encuentro **una sola vez**: cerrar dos veces no puede
 * recalcularlo (422 la segunda vez, hash sin cambiar en la fila). El PDF
 * oficial (`GET /charts/encounters/:id/pdf`) sólo existe una vez sellado el
 * encuentro: antes de cerrarlo responde 422, después 200 con bytes de PDF.
 */
describe('FX-17 · sello del encuentro y PDF oficial (C.4)', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());

  const sufijo = randomUUID().slice(0, 8);
  const PASSWORD = 'S3cret-passw0rd';

  const medico = {
    email: `fx17-med-${sufijo}@example.test`,
    token: '',
    hpid: '',
    tenantId: '',
  };

  let resourceId = '';
  let icd10ConceptId = '';

  function claims(token: string): Record<string, unknown> {
    const [, cuerpo] = token.split('.');
    return JSON.parse(Buffer.from(cuerpo, 'base64url').toString('utf8'));
  }

  /** Un lunes lejano: la agenda de esta suite no se cruza con la de otra. */
  function lunesLejano(semanas: number): Date {
    const d = new Date();
    d.setUTCHours(12, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() + ((8 - d.getUTCDay()) % 7 || 7) + semanas * 7);
    return d;
  }

  async function leerSelloDeLaFila(
    encounterId: string,
  ): Promise<{ content_hash: string | null; sealed_at: Date | null }> {
    const filas = await ctx.orm.em
      .getConnection()
      .execute<{ content_hash: string | null; sealed_at: Date | null }[]>(
        `select content_hash, sealed_at from clinical.encounters where id = ?`,
        [encounterId],
      );
    return filas[0];
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();

    // Un concepto ICD-10 real del catálogo, para que el diagnóstico del
    // encuentro sea verificable y el sello cubra un `codeConceptId` de
    // verdad, no un uuid inventado.
    const icd10 = await ctx.orm.em.getConnection().execute<{ id: string }[]>(
      `select cc.id
         from terminology.catalog_concepts cc
         join terminology.code_system_versions v on v.id = cc.code_system_version_id
         join terminology.code_systems cs on cs.id = v.code_system_id
        where cs.internal_code = 'ICD10'
        limit 1`,
    );
    icd10ConceptId = icd10[0]?.id ?? '';

    const alta = await http()
      .post('/iam/auth/register-practitioner')
      .send({
        ...identidadProfesional(medico.email),
        email: medico.email,
        password: PASSWORD,
        name: 'Elena',
        lastName: 'Salas',
        licenseNumber: `LIC-FX17-${sufijo}`,
        credentialNumber: `CRED-FX17-${sufijo}`,
      })
      .expect(201);
    medico.hpid = alta.body.practitionerProfileId;

    const login = await http()
      .post('/iam/auth/login')
      .send({ email: medico.email, password: PASSWORD })
      .expect(200);
    medico.token = login.body.accessToken;
    medico.tenantId = (claims(medico.token)['tenants'] as string[])[0];

    const recurso = await http()
      .post('/scheduling/resources')
      .set(bearer(medico.token))
      .send({
        tenantId: medico.tenantId,
        resourceType: 'PRACTITIONER',
        resourceRefType: 'health_practitioner_profiles',
        resourceRefId: medico.hpid,
        name: 'Consultorio FX-17',
        timeZone: 'America/La_Paz',
        capacity: 1,
      })
      .expect(201);
    resourceId = recurso.body.id;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('cierra el encuentro con hash de 64 hex, sella el PDF y rechaza el segundo cierre sin recalcular', async () => {
    const cuando = lunesLejano(2);
    cuando.setUTCHours(9, 0, 0, 0);
    const nationalId = `FX17A${sufijo}`;

    const walkIn = await http()
      .post('/scheduling/appointments/walk-in')
      .set(bearer(medico.token))
      .send({
        patient: {
          name: 'Paciente',
          lastName: 'FX-17',
          nationalId,
          phone: '+591 70000010',
        },
        resourceId,
        startAt: cuando.toISOString(),
        durationMinutes: 30,
        reasonText: 'Control FX-17',
      })
      .expect(201);

    const { patientProfileId, encounterId } = walkIn.body;

    await http()
      .post('/charts/notes')
      .set(bearer(medico.token))
      .send({
        patientProfileId,
        authorProfileId: medico.hpid,
        encounterId,
        chiefComplaintText: 'Control de rutina FX-17',
        subjectiveText: 'Sin síntomas nuevos',
      })
      .expect(201);

    // Un diagnóstico real del encuentro, para que el sello cubra un
    // `codeConceptId` de verdad (el hash arrastra los
    // diagnósticos del encuentro, no sólo las notas).
    if (icd10ConceptId !== '') {
      await http()
        .post('/clinical/conditions')
        .set(bearer(medico.token))
        .send({
          custodianTenantId: medico.tenantId,
          patientProfileId,
          encounterId,
          codeConceptId: icd10ConceptId,
        })
        .expect(201);
    }

    // Antes de cerrar: sin sello, el PDF oficial no existe todavía.
    await http()
      .get(`/charts/encounters/${encounterId}/pdf`)
      .set(bearer(medico.token))
      .expect(422);

    const cierre = await http()
      .post(`/clinical/encounters/${encounterId}/close`)
      .set(bearer(medico.token))
      .send({})
      .expect(200);

    expect(cierre.body.contentHash).toMatch(/^[0-9a-f]{64}$/);
    expect(cierre.body.sealedAt).toBeTruthy();

    const filaTrasCierre = await leerSelloDeLaFila(encounterId);
    expect(filaTrasCierre.content_hash).toBe(cierre.body.contentHash);
    expect(filaTrasCierre.sealed_at).toBeTruthy();

    const pdf = await http()
      .get(`/charts/encounters/${encounterId}/pdf`)
      .set(bearer(medico.token))
      .expect(200);

    expect(pdf.headers['content-type']).toContain('application/pdf');
    expect(Buffer.from(pdf.body).subarray(0, 4).toString('latin1')).toBe(
      '%PDF',
    );

    // Segundo cierre: 422, y el hash de la base no cambió.
    await http()
      .post(`/clinical/encounters/${encounterId}/close`)
      .set(bearer(medico.token))
      .send({})
      .expect(422);

    const filaTrasSegundoIntento = await leerSelloDeLaFila(encounterId);
    expect(filaTrasSegundoIntento.content_hash).toBe(
      filaTrasCierre.content_hash,
    );
  });
});
