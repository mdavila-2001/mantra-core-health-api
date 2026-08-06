import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { bootstrapTestApp, bearer, type TestContext } from './harness';
import { CONCEPTS, SEED } from '../../src/common';

/**
 * Las lecturas que sostienen el expediente en el frontend.
 *
 * `profiles` sólo exponía `GET /profiles/patients/me/summary` —el paciente
 * consultándose a sí mismo, y detrás del guard de identidad verificada—, y
 * `chart` no exponía ninguna lectura: se podían escribir notas, versionarlas,
 * firmarlas y liberarlas, pero ninguna pantalla podía mostrarlas. La pantalla
 * F-01 y el archivo clínico no tenían de dónde leer.
 */
describe('Expediente — lecturas de filiación, notas y resumen (integración)', () => {
  let ctx: TestContext;

  const tenantId = SEED.tenantId;
  let patientProfileId: string;
  let practitionerProfileId: string;
  let encounterId: string;
  let noteId: string;

  beforeAll(async () => {
    ctx = await bootstrapTestApp();

    const patient = await http()
      .post('/profiles/patients')
      .set(bearer(ctx.adminToken))
      .send({
        patientCode: `INT-CHART-${randomUUID().slice(0, 8)}`,
        displayName: `Filiación Integración ${randomUUID().slice(0, 6)}`,
        birthDate: '1975-11-30',
      })
      .expect(201);
    patientProfileId = patient.body.profileId;

    const practitioner = await http()
      .post('/profiles/practitioners')
      .set(bearer(ctx.adminToken))
      .send({
        practitionerCode: `INT-PRAC-${randomUUID().slice(0, 8)}`,
        displayName: 'Profesional de integración',
        licenseNumber: `LIC-${randomUUID().slice(0, 8)}`,
        credentialNumber: `CRED-${randomUUID().slice(0, 8)}`,
      })
      .expect(201);
    practitionerProfileId = practitioner.body.profileId;

    const episode = await http()
      .post('/clinical/care-episodes')
      .set(bearer(ctx.adminToken))
      .send({ patientProfileId, tenantId })
      .expect(201);

    const encounter = await http()
      .post('/clinical/encounters/check-in')
      .set(bearer(ctx.adminToken))
      .send({
        patientProfileId,
        tenantId,
        episodeId: episode.body.id,
        reasonText: 'Control de integración',
      })
      .expect(201);
    encounterId = encounter.body.id;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  const http = () => request(ctx.app.getHttpServer());

  it('lee la filiación completa del paciente (F-01)', async () => {
    const res = await http()
      .get(`/profiles/patients/${patientProfileId}`)
      .set(bearer(ctx.adminToken))
      .expect(200);

    expect(res.body.patientProfileId).toBe(patientProfileId);
    // El perfil de paciente y la persona comparten identificador.
    expect(res.body.personId).toBe(patientProfileId);
    // Una fecha de nacimiento se devuelve como fecha, sin hora inventada: con
    // hora, un cambio de zona horaria la desplaza un día.
    expect(res.body.birthDate).toBe('1975-11-30');
    expect(Array.isArray(res.body.identityLinks)).toBe(true);
    expect(Array.isArray(res.body.relatedPersons)).toBe(true);
  });

  it('devuelve 404 por un paciente inexistente, no una respuesta vacía', async () => {
    await http()
      .get(`/profiles/patients/${randomUUID()}`)
      .set(bearer(ctx.adminToken))
      .expect(404);
  });

  it('busca pacientes por nombre y por código', async () => {
    const filiation = await http()
      .get(`/profiles/patients/${patientProfileId}`)
      .set(bearer(ctx.adminToken))
      .expect(200);

    const byCode = await http()
      .get('/profiles/patients')
      .query({ patientCode: filiation.body.patientCode })
      .set(bearer(ctx.adminToken))
      .expect(200);
    expect(byCode.body.items).toHaveLength(1);
    expect(byCode.body.items[0].patientProfileId).toBe(patientProfileId);

    const byName = await http()
      .get('/profiles/patients')
      .query({ query: 'Filiación Integración' })
      .set(bearer(ctx.adminToken))
      .expect(200);
    expect(
      byName.body.items.map(
        (p: { patientProfileId: string }) => p.patientProfileId,
      ),
    ).toContain(patientProfileId);
  });

  it('no le roba la ruta a /profiles/patients/me/summary', async () => {
    // `me` no es un UUID: la ruta literal tiene que seguir ganando. El admin de
    // pruebas no tiene persona vinculada, así que el 403 del guard de identidad
    // es exactamente la señal de que llegó al handler correcto.
    const res = await http()
      .get('/profiles/patients/me/summary')
      .set(bearer(ctx.adminToken));

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('IDENTITY_VERIFICATION_REQUIRED');
  });

  it('lee las notas clínicas del paciente y el cuerpo de la versión vigente', async () => {
    const created = await http()
      .post('/charts/notes')
      .set(bearer(ctx.adminToken))
      .send({
        patientProfileId,
        authorProfileId: practitionerProfileId,
        encounterId,
        chiefComplaintText: 'Cefalea',
        subjectiveText: 'Refiere dolor desde ayer',
        objectiveText: 'TA 120/80',
        assessmentText: 'Cefalea tensional',
        planText: 'Analgésico y control',
      })
      .expect(201);
    noteId = created.body.noteId;

    const list = await http()
      .get(`/charts/patients/${patientProfileId}/notes`)
      .set(bearer(ctx.adminToken))
      .expect(200);
    expect(list.body.items.map((n: { noteId: string }) => n.noteId)).toContain(
      noteId,
    );
    // El listado trae el motivo de consulta pero NO el cuerpo completo: cinco
    // campos de texto libre por nota harían de la lista una descarga.
    const listed = list.body.items.find(
      (n: { noteId: string }) => n.noteId === noteId,
    );
    expect(listed.chiefComplaintText).toBe('Cefalea');
    expect(listed.subjectiveText).toBeUndefined();

    const detail = await http()
      .get(`/charts/notes/${noteId}`)
      .set(bearer(ctx.adminToken))
      .expect(200);
    expect(detail.body.currentVersion).not.toBeNull();
    expect(detail.body.currentVersion.subjectiveText).toBe(
      'Refiere dolor desde ayer',
    );
    expect(detail.body.currentVersion.planText).toBe('Analgésico y control');
    expect(detail.body.versions).toHaveLength(1);
  });

  it('filtra las notas por encuentro', async () => {
    const otherEncounter = randomUUID();
    const res = await http()
      .get(`/charts/patients/${patientProfileId}/notes`)
      .query({ encounterId: otherEncounter })
      .set(bearer(ctx.adminToken))
      .expect(200);
    expect(res.body.count).toBe(0);

    const mine = await http()
      .get(`/charts/patients/${patientProfileId}/notes`)
      .query({ encounterId })
      .set(bearer(ctx.adminToken))
      .expect(200);
    expect(mine.body.count).toBeGreaterThan(0);
  });

  it('lee el resumen clínico con problemas y alergias vigentes', async () => {
    await http()
      .post('/clinical/conditions')
      .set(bearer(ctx.adminToken))
      .send({
        custodianTenantId: tenantId,
        patientProfileId,
        encounterId,
        codeConceptId: CONCEPTS.STATE_ACTIVE,
      })
      .expect(201);

    await http()
      .post('/clinical/allergy-intolerances')
      .set(bearer(ctx.adminToken))
      .send({
        custodianTenantId: tenantId,
        patientProfileId,
        substanceConceptId: CONCEPTS.STATE_ACTIVE,
        reactions: [{ manifestationConceptId: CONCEPTS.STATE_ACTIVE }],
      })
      .expect(201);

    const res = await http()
      .get(`/clinical/patients/${patientProfileId}/summary`)
      .set(bearer(ctx.adminToken))
      .expect(200);

    expect(res.body.patientProfileId).toBe(patientProfileId);
    expect(res.body.conditions).toHaveLength(1);
    expect(res.body.allergies).toHaveLength(1);
    expect(res.body.truncated).toBe(false);
  });

  it('devuelve un resumen vacío, no un error, para un paciente sin historia', async () => {
    const fresh = await http()
      .post('/profiles/patients')
      .set(bearer(ctx.adminToken))
      .send({
        patientCode: `INT-EMPTY-${randomUUID().slice(0, 8)}`,
        displayName: 'Sin historia clínica',
      })
      .expect(201);

    const res = await http()
      .get(`/clinical/patients/${fresh.body.profileId}/summary`)
      .set(bearer(ctx.adminToken))
      .expect(200);

    expect(res.body.conditions).toEqual([]);
    expect(res.body.allergies).toEqual([]);
    expect(res.body.medications).toEqual([]);
  });
});
