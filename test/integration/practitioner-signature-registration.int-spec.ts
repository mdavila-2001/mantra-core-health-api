import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { CONCEPTS } from '../../src/common';
import {
  bootstrapTestApp,
  bearer,
  deleteRegisteredPractitioners,
  identidadProfesional,
  type TestContext,
} from './harness';

describe('Registro profesional con firma/sello (integración)', () => {
  let ctx: TestContext;
  const marca = randomUUID().slice(0, 8);
  const creados: { userId: string; personId: string }[] = [];
  const http = () => request(ctx.app.getHttpServer());
  function altaBase(sufijo: string) {
    const email = `qa-signature-${sufijo}@example.test`;
    return {
      ...identidadProfesional(email),
      email,
      password: 'S3cret-passw0rd',
      name: 'QA',
      lastName: 'Prueba',
      licenseNumber: `QA-${sufijo}`,
    };
  }
  beforeAll(async () => {
    ctx = await bootstrapTestApp();
  });
  afterAll(async () => {
    if (!ctx) return;
    await ctx.app.close();
    await deleteRegisteredPractitioners(creados);
  });
  describe('firma y sello privados durante el alta', () => {
    const imagen = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==',
      'base64',
    );

    it('precarga, reclama y conserva ambas referencias al consultar con sesión', async () => {
      const firma = await http()
        .post('/iam/auth/upload-registration-signature-image')
        .attach('file', imagen, {
          filename: 'qa-signature.png',
          contentType: 'image/png',
        })
        .expect(201);
      const sello = await http()
        .post('/iam/auth/upload-registration-signature-image')
        .attach('file', imagen, {
          filename: 'qa-seal.png',
          contentType: 'image/png',
        })
        .expect(201);
      await http().get(`/public/media/${firma.body.fileId}`).expect(404);
      const alta = altaBase(`${marca}-signature`);
      const registro = await http()
        .post('/iam/auth/register-practitioner')
        .send({
          ...alta,
          signatureFileId: firma.body.fileId,
          sealFileId: sello.body.fileId,
        })
        .expect(201);
      creados.push({
        userId: registro.body.userId,
        personId: registro.body.personId,
      });
      const login = await http()
        .post('/iam/auth/login')
        .send({ email: alta.email, password: alta.password })
        .expect(200);
      const guardados = await http()
        .get('/profiles/practitioners/me/signature-assets')
        .set(bearer(login.body.accessToken))
        .expect(200);
      expect(guardados.body).toEqual({
        signatureFileId: firma.body.fileId,
        sealFileId: sello.body.fileId,
      });
      for (const fileId of [firma.body.fileId, sello.body.fileId]) {
        const contenido = await http()
          .get(`/common/files/${fileId}/content`)
          .set(bearer(login.body.accessToken))
          .expect(200);
        expect(contenido.body).toEqual(imagen);
      }
      const filas = await ctx.orm.em
        .getConnection()
        .execute(
          'select signature_file_id, seal_file_id from profiles.health_practitioner_profiles where profile_id = ?',
          [registro.body.personId],
        );
      expect(filas[0]).toMatchObject({
        signature_file_id: firma.body.fileId,
        seal_file_id: sello.body.fileId,
      });
      const archivos = await ctx.orm.em
        .getConnection()
        .execute(
          'select created_by_user_id, sensitivity_concept_id from common.files where id in (?, ?)',
          [firma.body.fileId, sello.body.fileId],
        );
      expect(archivos).toHaveLength(2);
      for (const archivo of archivos) {
        expect(archivo.created_by_user_id).toBe(registro.body.userId);
        expect(archivo.sensitivity_concept_id).toBe(CONCEPTS.SENSITIVITY_PHI);
      }
    });

    it('una segunda referencia inválida revierte la cuenta y la primera reclamación', async () => {
      const firma = await http()
        .post('/iam/auth/upload-registration-signature-image')
        .attach('file', imagen, {
          filename: 'qa-rollback.png',
          contentType: 'image/png',
        })
        .expect(201);
      const alta = altaBase(`${marca}-signature-rollback`);
      const fallido = await http()
        .post('/iam/auth/register-practitioner')
        .send({
          ...alta,
          signatureFileId: firma.body.fileId,
          sealFileId: randomUUID(),
        });
      expect(fallido.status).toBeGreaterThanOrEqual(400);
      const archivos = await ctx.orm.em
        .getConnection()
        .execute('select created_by_user_id from common.files where id = ?', [
          firma.body.fileId,
        ]);
      expect(archivos[0].created_by_user_id).toBeNull();
      const cuentas = await ctx.orm.em
        .getConnection()
        .execute(
          'select user_id from iam.authentication_credentials where external_subject = ?',
          [alta.email],
        );
      expect(cuentas).toHaveLength(0);
    });
  });
});
