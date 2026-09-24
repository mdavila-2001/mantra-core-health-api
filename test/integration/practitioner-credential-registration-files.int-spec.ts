import { randomUUID } from 'node:crypto';
import request from 'supertest';
import {
  bootstrapTestApp,
  deleteRegisteredPractitioners,
  type TestContext,
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
    const fileIds = [
      await subirPdf('titulo-carrera-1.pdf'),
      await subirPdf('titulo-carrera-2.pdf'),
      await subirPdf('titulo-maestria.pdf'),
    ];
    const email = `credenciales-${marca}@example.test`;
    const alta = await http()
      .post('/iam/auth/register-practitioner')
      .send({
        email,
        password: 'S3cret-passw0rd',
        name: 'Elena',
        lastName: 'Salas',
        licenseNumber: `LIC-CRED-${marca}`,
        credentials: [
          {
            credentialTypeConceptId: PROF.CREDENTIAL_TYPE_DEGREE,
            number: `TIT-1-${marca}`,
            issuingInstitutionText: 'Universidad Mayor de San Andrés',
            fileId: fileIds[0],
          },
          {
            credentialTypeConceptId: PROF.CREDENTIAL_TYPE_DEGREE,
            number: `TIT-2-${marca}`,
            issuingInstitutionText: 'Universidad Autónoma Gabriel René Moreno',
            fileId: fileIds[1],
          },
          {
            credentialTypeConceptId: PROF.CREDENTIAL_TYPE_MASTER,
            number: `MAE-1-${marca}`,
            issuingInstitutionText: 'Universidad Católica Boliviana',
            fileId: fileIds[2],
          },
        ],
      })
      .expect(201);
    creados.push({ userId: alta.body.userId, personId: alta.body.personId });

    const em = ctx.orm.em.fork();
    const credentials = await em.find(ProfessionalCredentials, {
      practitionerProfileId: alta.body.practitionerProfileId,
    });
    expect(credentials).toHaveLength(3);
    expect(
      credentials
        .map((credential) => [credential.number, credential.fileId])
        .sort(([a], [b]) => String(a).localeCompare(String(b))),
    ).toEqual(
      [
        [`TIT-1-${marca}`, fileIds[0]],
        [`TIT-2-${marca}`, fileIds[1]],
        [`MAE-1-${marca}`, fileIds[2]],
      ].sort(([a], [b]) => String(a).localeCompare(String(b))),
    );

    const files = await em.find(Files, { id: { $in: fileIds } });
    expect(files).toHaveLength(3);
    for (const file of files) {
      expect(file.tenantId).toBe(SEED.tenantId);
      expect(file.createdByUserId).toBe(alta.body.userId);
    }

    const segundoEmail = `credenciales-reuso-${marca}@example.test`;
    const reuso = await http()
      .post('/iam/auth/register-practitioner')
      .send({
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
