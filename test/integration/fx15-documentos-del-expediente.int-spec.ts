import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { bootstrapTestApp, bearer, type TestContext } from './harness';
import { SEED } from '../../src/common';

/**
 * FX-15 · Documentos clínicos gobernados y firma propia en el expediente.
 *
 * Cuatro reglas nuevas, contra Postgres real:
 * 1. El vínculo `POST /charts/documents` no acepta cualquier `fileId`: pasa
 *    por `AttachableFileService.assertUsableBy` (existe, es del actor, sigue
 *    vivo, de un tipo admitido).
 * 2. `GET /charts/patients/:id/chart` publica los archivos vinculados de cada
 *    documento, ordenados, con su rol.
 * 3. `GET /charts/documents/:documentId/files/:fileId/content` sirve los
 *    bytes a quien puede leer la historia del paciente — no sólo a quien los
 *    subió — y da el mismo 404 tanto si el documento no existe como si el
 *    archivo no cuelga de él.
 * 4. Firmar una nota exige el perfil profesional propio del actor.
 */
describe('FX-15 · documentos del expediente y firma propia', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());

  const sufijo = randomUUID().slice(0, 8);
  const PASSWORD = 'S3cret-passw0rd';

  /** PDF mínimo, válido por su firma binaria (`%PDF-`): el tipo se deduce de los bytes. */
  const PDF_BYTES = Buffer.from('%PDF-1.4\n%%mock-pdf-content%%\n%%EOF');

  const medicoA = {
    email: `fx15-a-${sufijo}@example.test`,
    token: '',
    hpid: '',
  };
  const medicoB = {
    email: `fx15-b-${sufijo}@example.test`,
    token: '',
    hpid: '',
  };
  let patientProfileId = '';

  /** Descarga binaria: supertest/superagent no bufferiza tipos que no reconoce. */
  function parseBinary(
    res: request.Response,
    cb: (err: Error | null, body: Buffer) => void,
  ) {
    const chunks: Buffer[] = [];
    res.on('data', (chunk: Buffer) => chunks.push(chunk));
    res.on('end', () => cb(null, Buffer.concat(chunks)));
  }

  async function registrarMedico(
    email: string,
    etiqueta: string,
  ): Promise<{ token: string; hpid: string }> {
    const alta = await http()
      .post('/iam/auth/register-practitioner')
      .send({
        email,
        password: PASSWORD,
        name: 'Profesional',
        lastName: sufijo,
        licenseNumber: `LIC-FX15-${sufijo}-${etiqueta}`,
        credentialNumber: `CRED-FX15-${sufijo}-${etiqueta}`,
      })
      .expect(201);
    const hpid = alta.body.practitionerProfileId as string;

    const login = await http()
      .post('/iam/auth/login')
      .send({ email, password: PASSWORD })
      .expect(200);
    return { token: login.body.accessToken as string, hpid };
  }

  async function subirPdf(token: string, nombre: string): Promise<string> {
    const res = await http()
      .post('/common/files/upload')
      .set(bearer(token))
      .field('category', 'DOCUMENT')
      .field('sensitivity', 'PHI')
      .attach('file', PDF_BYTES, {
        filename: nombre,
        contentType: 'application/pdf',
      })
      .expect(201);
    return res.body.id as string;
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
        patientCode: `PAC-FX15-${sufijo}`,
        displayName: `Paciente FX-15 ${sufijo}`,
        birthDate: '1988-02-20',
      })
      .expect(201);
    patientProfileId = paciente.body.profileId;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('A sube un PDF propio y registra un documento con ese archivo (201, fileCount 1)', async () => {
    const fileId = await subirPdf(medicoA.token, 'informe-a.pdf');

    const res = await http()
      .post('/charts/documents')
      .set(bearer(medicoA.token))
      .send({
        patientProfileId,
        tenantId: SEED.tenantId,
        title: 'Informe de laboratorio',
        files: [{ fileId, contentRole: 'PRIMARY', ordinal: 0 }],
      })
      .expect(201);

    expect(res.body.fileCount).toBe(1);
  });

  it('A intentando vincular un archivo subido por B recibe 403', async () => {
    const fileDeB = await subirPdf(medicoB.token, 'informe-b.pdf');

    await http()
      .post('/charts/documents')
      .set(bearer(medicoA.token))
      .send({
        patientProfileId,
        tenantId: SEED.tenantId,
        title: 'Documento con archivo ajeno',
        files: [{ fileId: fileDeB }],
      })
      .expect(403);
  });

  it('un fileId inventado responde 404', async () => {
    await http()
      .post('/charts/documents')
      .set(bearer(medicoA.token))
      .send({
        patientProfileId,
        tenantId: SEED.tenantId,
        title: 'Documento con archivo inexistente',
        files: [{ fileId: randomUUID() }],
      })
      .expect(404);
  });

  it('un archivo borrado responde 422 al vincularlo', async () => {
    const fileId = await subirPdf(medicoA.token, 'informe-borrado.pdf');
    await http()
      .delete(`/common/files/${fileId}`)
      .set(bearer(medicoA.token))
      .expect(200);

    await http()
      .post('/charts/documents')
      .set(bearer(medicoA.token))
      .send({
        patientProfileId,
        tenantId: SEED.tenantId,
        title: 'Documento con archivo borrado',
        files: [{ fileId }],
      })
      .expect(422);
  });

  describe('lectura y descarga del documento vinculado', () => {
    let documentId = '';
    let fileId = '';

    beforeAll(async () => {
      fileId = await subirPdf(medicoA.token, 'informe-lectura.pdf');
      const res = await http()
        .post('/charts/documents')
        .set(bearer(medicoA.token))
        .send({
          patientProfileId,
          tenantId: SEED.tenantId,
          title: 'Informe leído desde el expediente',
          files: [{ fileId, contentRole: 'PRIMARY', ordinal: 0 }],
        })
        .expect(201);
      documentId = res.body.id;
    });

    it('CA-2: el expediente trae el archivo vinculado con su rol y ordinal', async () => {
      const chart = await http()
        .get(`/charts/patients/${patientProfileId}/chart`)
        .set(bearer(ctx.adminToken))
        .expect(200);

      const documento = chart.body.documents.find(
        (d: { id: string }) => d.id === documentId,
      );
      expect(documento).toBeDefined();
      expect(documento.files[0]).toEqual({
        fileId,
        contentRole: 'PRIMARY',
        ordinal: 0,
      });
    });

    it('CA-3 feliz: el contenido se descarga con los mismos bytes', async () => {
      const res = await http()
        .get(`/charts/documents/${documentId}/files/${fileId}/content`)
        .set(bearer(ctx.adminToken))
        .buffer(true)
        .parse(parseBinary)
        .expect(200);

      expect(res.headers['content-type']).toMatch(/^application\/pdf/);
      expect(Buffer.compare(res.body as Buffer, PDF_BYTES)).toBe(0);
    });

    it('CA-3 403: B no atiende a este paciente ni tiene relación con él', async () => {
      await http()
        .get(`/charts/documents/${documentId}/files/${fileId}/content`)
        .set(bearer(medicoB.token))
        .expect(403);
    });

    it('CA-3 404: fileId que no cuelga del documento, y documentId inexistente', async () => {
      const otroFileId = await subirPdf(medicoA.token, 'otro.pdf');
      await http()
        .get(`/charts/documents/${documentId}/files/${otroFileId}/content`)
        .set(bearer(ctx.adminToken))
        .expect(404);

      await http()
        .get(`/charts/documents/${randomUUID()}/files/${fileId}/content`)
        .set(bearer(ctx.adminToken))
        .expect(404);
    });
  });

  it('CA-4: una nota la firma su propio profesional', async () => {
    const nota = await http()
      .post('/charts/notes')
      .set(bearer(medicoA.token))
      .send({
        patientProfileId,
        authorProfileId: medicoA.hpid,
        chiefComplaintText: 'Control de rutina',
      })
      .expect(201);

    await http()
      .post(
        `/charts/notes/${nota.body.noteId}/versions/${nota.body.versionId}/sign`,
      )
      .set(bearer(medicoA.token))
      .send({ signerProfileId: medicoB.hpid })
      .expect(403);

    await http()
      .post(
        `/charts/notes/${nota.body.noteId}/versions/${nota.body.versionId}/sign`,
      )
      .set(bearer(medicoA.token))
      .send({ signerProfileId: medicoA.hpid })
      .expect(201);
  });
});
