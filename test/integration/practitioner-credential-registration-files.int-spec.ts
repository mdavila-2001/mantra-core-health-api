import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  bearer,
  deleteRegisteredPractitioners,
  type TestContext,
  identidadProfesional,
} from './harness';
import { SEED } from '../../src/common';
import { Files } from '../../src/modules/common/entities';
import { ProfessionalCredentials } from '../../src/modules/profiles/entities';
import { PROF } from '../../src/modules/profiles/profiles.concepts';
import { AuthenticationCredentials } from '../../src/modules/iam/entities';

describe('documentos de títulos del alta profesional (integración)', () => {
  let ctx: TestContext;
  const marca = randomUUID().slice(0, 8);
  const creados: { userId: string; personId: string }[] = [];
  const http = () => request(ctx.app.getHttpServer());
  const PDF = Buffer.from('%PDF-1.7\ncredencial académica sintética\n');

  async function subirPdf(nombre: string): Promise<string> {
    const res = await http()
      .post('/iam/auth/upload-registration-document')
      .attach('file', PDF, { filename: nombre, contentType: 'application/pdf' })
      .expect(201);
    expect(res.body).toMatchObject({
      originalName: nombre,
      mimeType: 'application/pdf',
    });
    return res.body.fileId;
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
    await deleteRegisteredPractitioners(creados);
  });

  it('guarda varios títulos con su PDF y rechaza reutilizar un archivo sin crear otra cuenta', async () => {
    const declaraciones = [
      {
        tipo: PROF.CREDENTIAL_TYPE_DEGREE,
        numero: `TIT-1-${marca}`,
        institucion: 'Universidad Mayor de San Andrés',
      },
      {
        tipo: PROF.CREDENTIAL_TYPE_DEGREE,
        numero: `TIT-2-${marca}`,
        institucion: 'Universidad Autónoma Gabriel René Moreno',
      },
      {
        tipo: PROF.CREDENTIAL_TYPE_DIPLOMA,
        numero: `DIP-1-${marca}`,
        institucion: 'Instituto Nacional de Salud Pública',
      },
      {
        tipo: PROF.CREDENTIAL_TYPE_DIPLOMA,
        numero: `DIP-2-${marca}`,
        institucion: 'Universidad Católica Boliviana',
      },
      {
        tipo: PROF.CREDENTIAL_TYPE_MASTER,
        numero: `MAE-1-${marca}`,
        institucion: 'Universidad Privada de Santa Cruz',
      },
      {
        tipo: PROF.CREDENTIAL_TYPE_MASTER,
        numero: `MAE-2-${marca}`,
        institucion: 'Universidad Andina Simón Bolívar',
      },
      {
        tipo: PROF.CREDENTIAL_TYPE_DOCTORATE,
        numero: `DOC-1-${marca}`,
        institucion: 'Universidad de Chile',
      },
      {
        tipo: PROF.CREDENTIAL_TYPE_DOCTORATE,
        numero: `DOC-2-${marca}`,
        institucion: 'Universidad Nacional de Córdoba',
      },
      {
        tipo: PROF.CREDENTIAL_TYPE_SPECIALTY,
        numero: `ESP-1-${marca}`,
        institucion: 'Colegio Médico Departamental',
      },
      {
        tipo: PROF.CREDENTIAL_TYPE_SPECIALTY,
        numero: `ESP-2-${marca}`,
        institucion: 'Sociedad Boliviana de Cardiología',
      },
    ];
    const fileIds: string[] = [];
    for (const { numero } of declaraciones) {
      fileIds.push(await subirPdf(`${numero}.pdf`));
    }
    const email = `credenciales-${marca}@example.test`;
    const alta = await http()
      .post('/iam/auth/register-practitioner')
      .send({
        ...identidadProfesional(email),
        email,
        password: 'S3cret-passw0rd',
        name: 'Elena',
        lastName: 'Salas',
        licenseNumber: `LIC-CRED-${marca}`,
        credentials: declaraciones.map((credential, index) => ({
          credentialTypeConceptId: credential.tipo,
          number: credential.numero,
          issuingInstitutionText: credential.institucion,
          fileId: fileIds[index],
        })),
      })
      .expect(201);
    creados.push({ userId: alta.body.userId, personId: alta.body.personId });

    const em = ctx.orm.em.fork();
    const credentials = await em.find(ProfessionalCredentials, {
      practitionerProfileId: alta.body.practitionerProfileId,
    });
    expect(credentials).toHaveLength(declaraciones.length);
    expect(
      credentials
        .map((credential) => [
          credential.number,
          credential.credentialTypeConceptId,
          credential.issuingInstitutionText,
          credential.fileId,
        ])
        .sort(([a], [b]) => String(a).localeCompare(String(b))),
    ).toEqual(
      declaraciones
        .map(({ numero, tipo, institucion }, index) => [
          numero,
          tipo,
          institucion,
          fileIds[index],
        ])
        .sort(([a], [b]) => String(a).localeCompare(String(b))),
    );

    const files = await em.find(Files, { id: { $in: fileIds } });
    expect(files).toHaveLength(declaraciones.length);
    for (const file of files) {
      expect(file.tenantId).toBe(SEED.tenantId);
      expect(file.createdByUserId).toBe(alta.body.userId);
    }

    const login = await http()
      .post('/iam/auth/login')
      .send({ email, password: 'S3cret-passw0rd' })
      .expect(200);
    const ownerToken = login.body.accessToken as string;
    const ownSummary = await http()
      .get('/profiles/practitioners/me/summary')
      .set(bearer(ownerToken))
      .expect(200);
    expect(
      ownSummary.body.credentials
        .map(
          (credential: {
            number: string;
            credentialTypeConceptId: string;
            issuingInstitutionText?: string;
            fileId?: string;
          }) => [
            credential.number,
            credential.credentialTypeConceptId,
            credential.issuingInstitutionText,
            credential.fileId,
          ],
        )
        .sort(([a]: string[], [b]: string[]) => a.localeCompare(b)),
    ).toEqual(
      declaraciones
        .map(({ numero, tipo, institucion }, index) => [
          numero,
          tipo,
          institucion,
          fileIds[index],
        ])
        .sort(([a], [b]) => a.localeCompare(b)),
    );

    const fichaPublica = await http()
      .get(`/profiles/practitioners/${alta.body.practitionerProfileId}/summary`)
      .set(bearer(ctx.adminToken))
      .expect(200);
    expect(fichaPublica.body.credentials).toHaveLength(declaraciones.length);
    for (const credential of fichaPublica.body.credentials) {
      expect(credential).not.toHaveProperty('fileId');
    }

    await http()
      .get(`/common/files/${fileIds[0]}/content`)
      .set(bearer(ownerToken))
      .expect(200)
      .expect('Content-Type', /application\/pdf/);

    const otroEmail = `credenciales-otro-${marca}@example.test`;
    const otraAlta = await http()
      .post('/iam/auth/register-practitioner')
      .send({
        ...identidadProfesional(otroEmail),
        email: otroEmail,
        password: 'S3cret-passw0rd',
        name: 'Otra',
        lastName: 'Profesional sintético',
        licenseNumber: `LIC-OTRO-${marca}`,
      })
      .expect(201);
    creados.push({
      userId: otraAlta.body.userId,
      personId: otraAlta.body.personId,
    });
    const otroLogin = await http()
      .post('/iam/auth/login')
      .send({ email: otroEmail, password: 'S3cret-passw0rd' })
      .expect(200);
    await http()
      .get(`/common/files/${fileIds[0]}/content`)
      .set(bearer(otroLogin.body.accessToken as string))
      .expect(403);

    const segundoEmail = `credenciales-reuso-${marca}@example.test`;
    const reuso = await http()
      .post('/iam/auth/register-practitioner')
      .send({
        ...identidadProfesional(segundoEmail),
        email: segundoEmail,
        password: 'S3cret-passw0rd',
        name: 'Otra',
        lastName: 'Persona',
        licenseNumber: `LIC-REUSO-${marca}`,
        credentials: [
          {
            credentialTypeConceptId: PROF.CREDENTIAL_TYPE_DEGREE,
            number: `TIT-REUSO-${marca}`,
            fileId: fileIds[0],
          },
        ],
      })
      .expect(422);
    expect(reuso.body.code).toBe('PRECONDITION_FAILED');

    const cuentasParciales = await em.count(AuthenticationCredentials, {
      externalSubject: segundoEmail,
    });
    expect(cuentasParciales).toBe(0);
  });
});
