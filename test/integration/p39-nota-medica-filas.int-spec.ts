import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  bearer,
  type TestContext,
  camposObligatoriosDePaciente,
  identidadProfesional,
} from './harness';

/**
 * P39 · las filas campo/valor de la nota médica (`entries_json`) contra
 * Postgres real.
 *
 * ## Qué se está protegiendo
 *
 * - Las filas viajan en `POST /charts/notes` y `PUT /charts/notes/:id/versions`,
 *   se guardan en la VERSIÓN (`chart.clinical_note_versions.entries_json`) y se
 *   devuelven en `GET /charts/patients/:id/chart` y `GET /charts/notes`.
 * - Agregar una versión no pisa la anterior: la v1 conserva sus filas.
 * - El servidor rechaza filas inválidas (cantidad, longitud, repetidas, HTML)
 *   antes de tocar la base.
 * - La autorización es la del expediente: un médico sin vínculo asistencial
 *   con el paciente recibe 403 y no deja nada escrito.
 *
 * Datos sintéticos: rótulos y valores inventados para la prueba.
 */
describe('P39 · filas campo/valor de la nota médica', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());

  const sufijo = randomUUID().slice(0, 8);
  const PASSWORD = 'S3cret-passw0rd';
  const FILAS_V1 = [
    { label: 'Campo sintético uno', value: 'Valor < 140' },
    { label: 'Campo sintético dos', value: 'Valor dos' },
  ];
  const FILAS_V2 = [{ label: 'Campo sintético tres', value: 'Valor tres' }];

  const medico = { token: '', hpid: '' };
  const ajeno = { token: '', hpid: '' };
  let patientProfileId = '';
  let noteId = '';
  let v1 = '';
  let v2 = '';

  function claims(token: string): Record<string, unknown> {
    const [, cuerpo] = token.split('.');
    return JSON.parse(Buffer.from(cuerpo, 'base64url').toString('utf8'));
  }

  async function registrarMedico(
    etiqueta: string,
  ): Promise<{ token: string; hpid: string }> {
    const email = `p39-${etiqueta}-${sufijo}@example.test`;
    const alta = await http()
      .post('/iam/auth/register-practitioner')
      .send({
        ...identidadProfesional(email),
        email,
        password: PASSWORD,
        name: 'Profesional',
        lastName: sufijo,
        licenseNumber: `LIC-P39-${sufijo}-${etiqueta}`,
        credentialNumber: `CRED-P39-${sufijo}-${etiqueta}`,
      })
      .expect(201);
    const login = await http()
      .post('/iam/auth/login')
      .send({ email, password: PASSWORD })
      .expect(200);
    return {
      token: login.body.accessToken as string,
      hpid: alta.body.practitionerProfileId as string,
    };
  }

  async function versionEnBase(versionId: string): Promise<unknown> {
    const rows = await ctx.orm.em
      .getConnection()
      .execute<{ entries_json: unknown }[]>(
        'select entries_json from chart.clinical_note_versions where id = ?',
        [versionId],
      );
    return rows[0]?.entries_json;
  }

  async function cantidadDeNotas(): Promise<number> {
    const rows = await ctx.orm.em
      .getConnection()
      .execute<{ n: string }[]>(
        'select count(*)::text as n from chart.clinical_note_headers where patient_profile_id = ?',
        [patientProfileId],
      );
    return Number(rows[0].n);
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    Object.assign(medico, await registrarMedico('a'));
    Object.assign(ajeno, await registrarMedico('b'));

    // El paciente se registra solo y acepta el vínculo asistencial que pide
    // `medico` (mismo camino que `clinical-c14-c23-notas-e-internacion`).
    // `ajeno` nunca pide vínculo.
    const campos = await camposObligatoriosDePaciente(ctx);
    const nationalId = `P39-${sufijo}`;
    await http()
      .post('/iam/auth/register-patient')
      .send({
        ...campos,
        nationalId,
        password: PASSWORD,
        displayName: `Paciente P39 ${sufijo}`,
        email: `p39-pac-${sufijo}@example.test`,
      })
      .expect(201);
    const loginPaciente = await http()
      .post('/iam/auth/login')
      .send({ nationalId, password: PASSWORD })
      .expect(200);
    const tokenPaciente = loginPaciente.body.accessToken as string;
    patientProfileId = claims(tokenPaciente)['pid'] as string;

    const solicitud = await http()
      .post('/authz/care-relationships/request')
      .set(bearer(medico.token))
      .send({
        tenantId: (claims(medico.token)['tenants'] as string[])[0],
        patientProfileId,
        relationshipType: 'TREATING',
        reasonText: 'P39 (integración, datos sintéticos)',
      })
      .expect(201);
    await http()
      .post(`/authz/care-relationships/${solicitud.body.id}/respond`)
      .set(bearer(tokenPaciente))
      .send({ decision: 'ACCEPT' })
      .expect(200);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('POST /charts/notes guarda las filas recortadas en la versión 1', async () => {
    const res = await http()
      .post('/charts/notes')
      .set(bearer(medico.token))
      .send({
        patientProfileId,
        entries: FILAS_V1.map(({ label, value }) => ({
          label: `  ${label} `,
          value,
        })),
        subjectiveText: 'Texto libre sintético',
      })
      .expect(201);
    noteId = res.body.noteId;
    v1 = res.body.versionId;
    expect(res.body.versionNumber).toBe(1);
    expect(await versionEnBase(v1)).toEqual(FILAS_V1);
  });

  it('GET /charts/patients/:id/chart devuelve las filas de la versión vigente', async () => {
    const res = await http()
      .get(`/charts/patients/${patientProfileId}/chart`)
      .set(bearer(medico.token))
      .expect(200);
    const nota = res.body.notes.find(
      (n: { noteId: string }) => n.noteId === noteId,
    );
    expect(nota.entries).toEqual(FILAS_V1);
    expect(nota.subjectiveText).toBe('Texto libre sintético');
  });

  it('PUT …/versions crea la v2 con sus filas y la v1 queda intacta', async () => {
    const res = await http()
      .put(`/charts/notes/${noteId}/versions`)
      .set(bearer(medico.token))
      .send({ entries: FILAS_V2 })
      .expect(201);
    v2 = res.body.versionId;
    expect(res.body.versionNumber).toBe(2);
    expect(v2).not.toBe(v1);
    expect(await versionEnBase(v2)).toEqual(FILAS_V2);
    expect(await versionEnBase(v1)).toEqual(FILAS_V1);
  });

  it('GET /charts/notes devuelve las filas de la v2', async () => {
    const res = await http()
      .get(`/charts/notes?patientProfileId=${patientProfileId}`)
      .set(bearer(medico.token))
      .expect(200);
    const nota = res.body.items.find(
      (n: { noteId: string }) => n.noteId === noteId,
    );
    expect(nota.versionNumber).toBe(2);
    expect(nota.entries).toEqual(FILAS_V2);
  });

  it('una versión sin filas guarda null y la lectura omite entries', async () => {
    const res = await http()
      .put(`/charts/notes/${noteId}/versions`)
      .set(bearer(medico.token))
      .send({ objectiveText: 'Sólo texto' })
      .expect(201);
    expect(await versionEnBase(res.body.versionId)).toBeNull();
    const chart = await http()
      .get(`/charts/patients/${patientProfileId}/chart`)
      .set(bearer(medico.token))
      .expect(200);
    const nota = chart.body.notes.find(
      (n: { noteId: string }) => n.noteId === noteId,
    );
    expect(nota).not.toHaveProperty('entries');
    expect(nota.objectiveText).toBe('Sólo texto');
  });

  it.each([
    [
      'más de 40 filas',
      Array.from({ length: 41 }, (_, i) => ({ label: `C${i}`, value: 'v' })),
      'entries',
    ],
    [
      'un rótulo de 61',
      [{ label: 'r'.repeat(61), value: 'v' }],
      'entries.0.label',
    ],
    [
      'un valor de 501',
      [{ label: 'Campo', value: 'v'.repeat(501) }],
      'entries.0.value',
    ],
    [
      'un rótulo repetido sin distinguir tildes',
      [
        { label: 'Presión', value: '1' },
        { label: 'presion', value: '2' },
      ],
      'entries',
    ],
    [
      'HTML en el valor',
      [{ label: 'Campo', value: '<b>x</b>' }],
      'entries.0.value',
    ],
  ])('rechaza %s con 400 y no crea la nota', async (_, entries, field) => {
    const antes = await cantidadDeNotas();
    const res = await http()
      .post('/charts/notes')
      .set(bearer(medico.token))
      .send({ patientProfileId, entries })
      .expect(400);
    expect(res.body.code).toBe('VALIDATION_FAILED');
    expect(
      res.body.details.fields.map((f: { field: string }) => f.field),
    ).toContain(field);
    expect(await cantidadDeNotas()).toBe(antes);
  });

  it('un médico sin vínculo con el paciente recibe 403 y no escribe filas', async () => {
    const antes = await cantidadDeNotas();
    await http()
      .post('/charts/notes')
      .set(bearer(ajeno.token))
      .send({ patientProfileId, entries: FILAS_V1 })
      .expect(403);
    expect(await cantidadDeNotas()).toBe(antes);

    await http()
      .put(`/charts/notes/${noteId}/versions`)
      .set(bearer(ajeno.token))
      .send({ entries: FILAS_V1 })
      .expect(403);
    const versiones = await ctx.orm.em
      .getConnection()
      .execute<{ n: string }[]>(
        'select count(*)::text as n from chart.clinical_note_versions where clinical_note_id = ?',
        [noteId],
      );
    expect(Number(versiones[0].n)).toBe(3);
  });

  it('un médico sin vínculo no lee las filas por el expediente', async () => {
    await http()
      .get(`/charts/patients/${patientProfileId}/chart`)
      .set(bearer(ajeno.token))
      .expect(403);
  });
});
