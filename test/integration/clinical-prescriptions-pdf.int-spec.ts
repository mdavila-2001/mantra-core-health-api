import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  bearer,
  type TestContext,
  camposObligatoriosDePaciente,
} from './harness';

/**
 * B.3 · PDF oficial de receta y su verificación pública, contra la base.
 *
 * ## Por qué contra la base y no con dobles
 *
 * Igual que `fx17-sello-del-encuentro.int-spec.ts`: lo que hay que comprobar
 * es **quién puede descargar qué** y que el sello sea estable, y eso depende
 * de filas reales — el prescriptor, la titular, la ajena — con tokens de
 * verdad, no de lo que un doble decida devolver.
 *
 * No trunca la base: cada corrida registra sus propias personas con
 * documentos únicos, así que es reproducible sin llevarse por delante lo que
 * ya haya.
 */
describe('B.3 · PDF oficial de receta y verificación pública (integración)', () => {
  let ctx: TestContext;
  let camposDePaciente: Awaited<
    ReturnType<typeof camposObligatoriosDePaciente>
  >;
  const http = () => request(ctx.app.getHttpServer());

  const sufijo = randomUUID().slice(0, 8);
  const PASSWORD = 'S3cret-passw0rd';

  const medico = { email: '', token: '', hpid: '', tenantId: '' };
  const titular = { nationalId: '', token: '', pid: '' };
  const ajeno = { nationalId: '', token: '' };

  let medicationConceptId = '';
  let draftRequestId = '';

  /**
   * `pdfkit` cambia a UTF-16BE (con BOM) cualquier string de metadatos
   * (`Info.Subject`, `Info.Title`…) que tenga un solo carácter fuera de
   * ASCII puro — «é», «—»… lo que es casi cualquier oración en castellano.
   * El texto de la página (`doc.text(...)`) sigue en WinAnsi de un byte, así
   * que se busca en las dos codificaciones.
   */
  function contieneTexto(pdf: Buffer, texto: string): boolean {
    if (pdf.toString('latin1').includes(texto)) return true;
    const utf16be = Buffer.alloc(texto.length * 2);
    for (let i = 0; i < texto.length; i += 1) {
      utf16be.writeUInt16BE(texto.charCodeAt(i), i * 2);
    }
    return pdf.includes(utf16be);
  }

  function claims(token: string): Record<string, unknown> {
    const [, cuerpo] = token.split('.');
    return JSON.parse(Buffer.from(cuerpo, 'base64url').toString('utf8'));
  }

  async function registrarPaciente(
    etiqueta: string,
  ): Promise<{ nationalId: string; token: string; pid: string }> {
    const nationalId = `B3-${etiqueta}-${sufijo}`;
    await http()
      .post('/iam/auth/register-patient')
      .send({
        ...camposDePaciente,
        nationalId,
        password: PASSWORD,
        displayName: `Paciente ${etiqueta}`,
        email: `b3-${etiqueta}-${sufijo}@example.test`,
      })
      .expect(201);

    const login = await http()
      .post('/iam/auth/login')
      .send({ nationalId, password: PASSWORD })
      .expect(200);
    const token = login.body.accessToken as string;
    return { nationalId, token, pid: claims(token)['pid'] as string };
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    camposDePaciente = await camposObligatoriosDePaciente(ctx);

    medico.email = `b3-med-${sufijo}@example.test`;
    const altaMedico = await http()
      .post('/iam/auth/register-practitioner')
      .send({
        email: medico.email,
        password: PASSWORD,
        name: 'Sofía',
        lastName: 'Delgado',
        licenseNumber: `LIC-B3-${sufijo}`,
        credentialNumber: `CRED-B3-${sufijo}`,
      })
      .expect(201);
    medico.hpid = altaMedico.body.practitionerProfileId;

    const loginMedico = await http()
      .post('/iam/auth/login')
      .send({ email: medico.email, password: PASSWORD })
      .expect(200);
    medico.token = loginMedico.body.accessToken;
    medico.tenantId = (claims(medico.token)['tenants'] as string[])[0];

    const t = await registrarPaciente('titular');
    titular.nationalId = t.nationalId;
    titular.token = t.token;
    titular.pid = t.pid;

    const a = await registrarPaciente('ajeno');
    ajeno.nationalId = a.nationalId;
    ajeno.token = a.token;

    const concepts = await http()
      .get('/terminology/concepts?limit=1')
      .set(bearer(medico.token))
      .expect(200);
    medicationConceptId = concepts.body.items[0].conceptId;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('DRAFT: la titular descarga la copia de trabajo, una ajena no, y el verify público no expone el hash', async () => {
    const prescripcion = await http()
      .post('/clinical/medication-requests')
      .set(bearer(medico.token))
      .send({
        custodianTenantId: medico.tenantId,
        patientProfileId: titular.pid,
        medicationConceptId,
        prescriberProfileId: medico.hpid,
        doseText: '500 mg',
        frequencyText: 'cada 8 horas',
        patientInstructionsText: 'Tomar con alimentos.',
      })
      .expect(201);
    draftRequestId = prescripcion.body.id;

    const pdfDeLaTitular = await http()
      .get(`/clinical/prescriptions/${draftRequestId}/pdf`)
      .set(bearer(titular.token))
      .expect(200);
    expect(pdfDeLaTitular.headers['content-type']).toContain('application/pdf');
    const bytes = Buffer.from(pdfDeLaTitular.body);
    expect(bytes.subarray(0, 4).toString('latin1')).toBe('%PDF');
    expect(contieneTexto(bytes, 'Copia de trabajo')).toBe(true);

    // Otra paciente, sin vínculo con esta receta: 403, no 404 — el rechazo es
    // indistinguible entre ajena e inexistente.
    await http()
      .get(`/clinical/prescriptions/${draftRequestId}/pdf`)
      .set(bearer(ajeno.token))
      .expect(403);

    // Sin token, sin PHI: el verify público existe desde que la receta nace,
    // pero un borrador no expone su sello — cambia con cada edición.
    const verify = await http()
      .get(`/public/prescriptions/${draftRequestId}/verify`)
      .expect(200);
    expect(verify.body).toMatchObject({ id: draftRequestId, status: 'DRAFT' });
    expect(verify.body.contentHash).toBeNull();
    expect(verify.body).not.toHaveProperty('patientName');
    expect(verify.body).not.toHaveProperty('medicationConceptId');
    expect(verify.headers['cache-control']).toBe('no-store');
  });

  it('ISSUED: el documento queda oficial, el prescriptor pasa sin turno, y el verify expone un hash estable', async () => {
    await http()
      .post(`/clinical/medication-requests/${draftRequestId}/sign`)
      .set(bearer(medico.token))
      .send({})
      .expect(200);
    await http()
      .post(`/clinical/medication-requests/${draftRequestId}/issue`)
      .set(bearer(medico.token))
      .send({})
      .expect(200);

    const pdfDeLaTitular = await http()
      .get(`/clinical/prescriptions/${draftRequestId}/pdf`)
      .set(bearer(titular.token))
      .expect(200);
    expect(pdfDeLaTitular.headers['content-disposition']).toBe(
      `attachment; filename*=UTF-8''receta-${draftRequestId}.pdf`,
    );
    const bytesOficiales = Buffer.from(pdfDeLaTitular.body);
    expect(bytesOficiales.length).toBeGreaterThan(1000);
    expect(bytesOficiales.toString('latin1')).toMatch(/sello:[0-9a-f]{64}/);
    expect(contieneTexto(bytesOficiales, 'Copia de trabajo')).toBe(false);

    // El prescriptor descarga la suya sin tener un turno con esta paciente hoy:
    // `PrescriptionPdfService` lo deja pasar antes de preguntarle a la agenda.
    await http()
      .get(`/clinical/prescriptions/${draftRequestId}/pdf`)
      .set(bearer(medico.token))
      .expect(200);

    const primeraVerificacion = await http()
      .get(`/public/prescriptions/${draftRequestId}/verify`)
      .expect(200);
    expect(primeraVerificacion.body.status).toBe('ISSUED');
    expect(primeraVerificacion.body.contentHash).toMatch(/^[0-9a-f]{64}$/);
    expect(primeraVerificacion.body.prescriberLicense).toMatchObject({
      number: `LIC-B3-${sufijo}`,
    });

    // Recalculado, no persistido: dos consultas dan el mismo hash porque la
    // receta ya es inmutable (issue() la sella).
    const segundaVerificacion = await http()
      .get(`/public/prescriptions/${draftRequestId}/verify`)
      .expect(200);
    expect(segundaVerificacion.body.contentHash).toBe(
      primeraVerificacion.body.contentHash,
    );
  });

  it('una receta inexistente responde 404 en el PDF y en el verify', async () => {
    const inventado = randomUUID();

    await http()
      .get(`/clinical/prescriptions/${inventado}/pdf`)
      .set(bearer(titular.token))
      .expect(404);
    await http().get(`/public/prescriptions/${inventado}/verify`).expect(404);
  });
});
