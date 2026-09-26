import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  bearer,
  type TestContext,
  identidadProfesional,
} from './harness';

/**
 * FX-11 · `GET /charts/notes` lista lo del profesional que la pide, en su
 * ventana de fechas y con cursor (P18).
 *
 * ## Qué se está protegiendo
 *
 * El alcance de esta colección no lo impone ningún guard ni RLS: `ClinicalRecordAccessGuard`
 * se autoexcluye sin `:patientProfileId` en la ruta, y el agregado de notas
 * clínicas no tiene `tenant_id`. Todo el aislamiento entre profesionales lo
 * decide `ChartNotesReadService`, así que esta suite es la única red que
 * comprueba, contra Postgres real, que un profesional jamás recibe las notas
 * de otro.
 */
describe('FX-11 · la colección de notas de evolución (P18)', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());

  const sufijo = randomUUID().slice(0, 8);
  const PASSWORD = 'S3cret-passw0rd';

  const medicoA = {
    email: `fx11-a-${sufijo}@example.test`,
    token: '',
    hpid: '',
  };
  const medicoB = {
    email: `fx11-b-${sufijo}@example.test`,
    token: '',
    hpid: '',
  };
  let patientProfileId = '';

  const notasA: string[] = [];
  const notasB: string[] = [];
  let notaEnmendadaId = '';
  let versionEnmendadaId = '';
  let mitadDeLaVentana = '';

  function claims(token: string): Record<string, unknown> {
    const [, cuerpo] = token.split('.');
    return JSON.parse(Buffer.from(cuerpo, 'base64url').toString('utf8'));
  }

  async function registrarMedico(
    email: string,
    etiqueta: string,
  ): Promise<{ token: string; hpid: string }> {
    const alta = await http()
      .post('/iam/auth/register-practitioner')
      .send({
        ...identidadProfesional(email),
        email,
        password: PASSWORD,
        name: 'Profesional',
        lastName: sufijo,
        licenseNumber: `LIC-FX11-${sufijo}-${etiqueta}`,
        credentialNumber: `CRED-FX11-${sufijo}-${etiqueta}`,
      })
      .expect(201);
    const hpid = alta.body.practitionerProfileId as string;

    const login = await http()
      .post('/iam/auth/login')
      .send({ email, password: PASSWORD })
      .expect(200);
    return { token: login.body.accessToken as string, hpid };
  }

  async function crearNota(
    token: string,
    authorProfileId: string,
    chiefComplaintText: string,
  ): Promise<{ noteId: string; versionId: string }> {
    const res = await http()
      .post('/charts/notes')
      .set(bearer(token))
      .send({ patientProfileId, authorProfileId, chiefComplaintText })
      .expect(201);
    return { noteId: res.body.noteId, versionId: res.body.versionId };
  }

  function esperar(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();

    const a = await registrarMedico(medicoA.email, 'A');
    medicoA.token = a.token;
    medicoA.hpid = a.hpid;
    const b = await registrarMedico(medicoB.email, 'B');
    medicoB.token = b.token;
    medicoB.hpid = b.hpid;

    const paciente = await http()
      .post('/profiles/patients')
      .set(bearer(ctx.adminToken))
      .send({
        patientCode: `PAC-FX11-${sufijo}`,
        displayName: `Paciente FX-11 ${sufijo}`,
        birthDate: '1990-05-14',
      })
      .expect(201);
    patientProfileId = paciente.body.profileId;

    // Escribir en la historia exige una relación asistencial vigente (MCH-007):
    // los dos médicos atienden a este paciente, cada uno desde su consultorio.
    for (const medico of [medicoA, medicoB]) {
      const tenantId = (
        JSON.parse(
          Buffer.from(medico.token.split('.')[1], 'base64url').toString('utf8'),
        ).tenants as string[]
      )[0];
      await http()
        .post('/authz/care-relationships')
        .set(bearer(ctx.adminToken))
        .send({
          tenantId,
          patientProfileId,
          practitionerProfileId: medico.hpid,
          relationshipType: 'TREATING',
        })
        .expect(201);
    }

    // Primer lote: 3 notas de A, con una marca de tiempo después para poder
    // acotar la ventana entre este lote y el siguiente.
    const primeraNota = await crearNota(medicoA.token, medicoA.hpid, 'Nota A0');
    notasA.push(primeraNota.noteId);
    notaEnmendadaId = primeraNota.noteId;
    versionEnmendadaId = primeraNota.versionId;
    for (let i = 1; i < 3; i++) {
      const n = await crearNota(medicoA.token, medicoA.hpid, `Nota A${i}`);
      notasA.push(n.noteId);
    }
    await esperar(30);
    mitadDeLaVentana = new Date().toISOString();
    await esperar(30);
    // Segundo lote: 2 notas más de A (total 5).
    for (let i = 3; i < 5; i++) {
      const n = await crearNota(medicoA.token, medicoA.hpid, `Nota A${i}`);
      notasA.push(n.noteId);
    }

    for (let i = 0; i < 2; i++) {
      const n = await crearNota(medicoB.token, medicoB.hpid, `Nota B${i}`);
      notasB.push(n.noteId);
    }
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('A sin parámetros recibe sus 5 notas, ninguna de B, con el paciente en cada ítem', async () => {
    const res = await http()
      .get('/charts/notes')
      .set(bearer(medicoA.token))
      .expect(200);

    expect(res.body.items).toHaveLength(5);
    expect(res.body.count).toBe(5);
    const ids = res.body.items.map((item: { noteId: string }) => item.noteId);
    expect(new Set(ids)).toEqual(new Set(notasA));
    for (const item of res.body.items) {
      expect(item.patientProfileId).toBe(patientProfileId);
    }
  });

  it('pagina con cursor sin repetir ni perder notas (limit=2)', async () => {
    const vistos = new Set<string>();

    const p1 = await http()
      .get('/charts/notes?limit=2')
      .set(bearer(medicoA.token))
      .expect(200);
    expect(p1.body.items).toHaveLength(2);
    expect(p1.body.nextCursor).not.toBeNull();
    p1.body.items.forEach((i: { noteId: string }) => vistos.add(i.noteId));

    const p2 = await http()
      .get(
        `/charts/notes?limit=2&cursor=${encodeURIComponent(p1.body.nextCursor)}`,
      )
      .set(bearer(medicoA.token))
      .expect(200);
    expect(p2.body.items).toHaveLength(2);
    expect(p2.body.nextCursor).not.toBeNull();
    p2.body.items.forEach((i: { noteId: string }) => vistos.add(i.noteId));

    const p3 = await http()
      .get(
        `/charts/notes?limit=2&cursor=${encodeURIComponent(p2.body.nextCursor)}`,
      )
      .set(bearer(medicoA.token))
      .expect(200);
    expect(p3.body.items).toHaveLength(1);
    expect(p3.body.nextCursor).toBeNull();
    p3.body.items.forEach((i: { noteId: string }) => vistos.add(i.noteId));

    expect(vistos.size).toBe(5);
    expect(vistos).toEqual(new Set(notasA));
  });

  it('la ventana de fechas excluye las notas fuera de rango', async () => {
    const primerLote = await http()
      .get(`/charts/notes?to=${encodeURIComponent(mitadDeLaVentana)}`)
      .set(bearer(medicoA.token))
      .expect(200);
    expect(primerLote.body.count).toBe(3);

    const segundoLote = await http()
      .get(`/charts/notes?from=${encodeURIComponent(mitadDeLaVentana)}`)
      .set(bearer(medicoA.token))
      .expect(200);
    expect(segundoLote.body.count).toBe(2);
  });

  it('A pidiendo las notas de B recibe 403', async () => {
    await http()
      .get(`/charts/notes?practitionerId=${medicoB.hpid}`)
      .set(bearer(medicoA.token))
      .expect(403);
  });

  it('SUPERADMIN sin practitionerId recibe 403, y con practitionerId ve las notas de ese profesional', async () => {
    await http().get('/charts/notes').set(bearer(ctx.adminToken)).expect(403);

    const res = await http()
      .get(`/charts/notes?practitionerId=${medicoB.hpid}`)
      .set(bearer(ctx.adminToken))
      .expect(200);
    expect(res.body.count).toBe(2);
    const ids = res.body.items.map((item: { noteId: string }) => item.noteId);
    expect(new Set(ids)).toEqual(new Set(notasB));
  });

  it('from posterior a to responde 400', async () => {
    await http()
      .get(
        '/charts/notes?from=2026-12-31T00:00:00.000Z&to=2026-01-01T00:00:00.000Z',
      )
      .set(bearer(medicoA.token))
      .expect(400);
  });

  it('un cursor corrupto responde 400', async () => {
    await http()
      .get('/charts/notes?cursor=esto-no-es-un-cursor-valido')
      .set(bearer(medicoA.token))
      .expect(400);
  });

  it('la nota enmendada aparece una sola vez, con el texto de su versión vigente', async () => {
    await http()
      .post(
        `/charts/notes/${notaEnmendadaId}/versions/${versionEnmendadaId}/sign`,
      )
      .set(bearer(medicoA.token))
      .send({ signerProfileId: medicoA.hpid })
      .expect(201);

    await http()
      .post(`/charts/notes/${notaEnmendadaId}/amendments`)
      .set(bearer(medicoA.token))
      .send({
        authorProfileId: medicoA.hpid,
        amendmentReasonText: 'Corrección de texto clínico',
        planText: 'Plan revisado tras la enmienda',
      })
      .expect(201);

    const res = await http()
      .get('/charts/notes')
      .set(bearer(medicoA.token))
      .expect(200);

    expect(res.body.count).toBe(5);
    const ocurrencias = res.body.items.filter(
      (item: { noteId: string }) => item.noteId === notaEnmendadaId,
    );
    expect(ocurrencias).toHaveLength(1);
    expect(ocurrencias[0].planText).toBe('Plan revisado tras la enmienda');
    expect(ocurrencias[0].versionNumber).toBe(2);
  });
});
