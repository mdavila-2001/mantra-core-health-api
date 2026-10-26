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
import { JurisdictionAuthorizations } from '../../src/modules/profiles/entities';
import { PROF } from '../../src/modules/profiles/profiles.concepts';
import { AuthenticationCredentials } from '../../src/modules/iam/entities';

/**
 * P29 — el alta pública lleva el respaldo de la matrícula y del SEDES.
 *
 * Contra la base real: el PDF se precarga sin dueño, el alta lo reclama para la
 * cuenta nueva y lo deja en `profiles.jurisdiction_authorizations.file_id`
 * (modelo v4.2.12). Datos sintéticos.
 */
describe('respaldos de la habilitación en el alta profesional (P29, integración)', () => {
  let ctx: TestContext;
  const marca = randomUUID().slice(0, 8);
  const creados: { userId: string; personId: string }[] = [];
  const http = () => request(ctx.app.getHttpServer());
  const PDF = Buffer.from('%PDF-1.7\nmatrícula sintética\n');

  async function subirPdf(nombre: string): Promise<string> {
    const res = await http()
      .post('/iam/auth/upload-registration-document')
      .attach('file', PDF, { filename: nombre, contentType: 'application/pdf' })
      .expect(201);
    return res.body.fileId;
  }

  function alta(email: string, extra: Record<string, unknown>) {
    return http()
      .post('/iam/auth/register-practitioner')
      .send({
        ...identidadProfesional(email),
        email,
        password: 'S3cret-passw0rd',
        name: 'Elena',
        lastName: 'Salas',
        licenseNumber: `MP-${marca}-${email.length}`,
        ...extra,
      });
  }

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
    await deleteRegisteredPractitioners(creados);
  });

  it('guarda cada PDF en su habilitación, a nombre del titular y sólo visible para él', async () => {
    const matricula = await subirPdf(`matricula-${marca}.pdf`);
    const sedes = await subirPdf(`sedes-${marca}.pdf`);
    const email = `matricula-${marca}@example.test`;

    const res = await alta(email, {
      licenseFileId: matricula,
      sedesLicenseNumber: `T.I. ${marca}`,
      sedesLicenseFileId: sedes,
    }).expect(201);
    creados.push({ userId: res.body.userId, personId: res.body.personId });

    const em = ctx.orm.em.fork();
    const filas = await em.find(JurisdictionAuthorizations, {
      practitionerProfileId: res.body.practitionerProfileId,
    });
    expect(
      filas
        .map((fila) => [
          fila.jurisdictionConceptId,
          fila.fileId,
          fila.stateConceptId,
        ])
        .sort(([a], [b]) => String(a).localeCompare(String(b))),
    ).toEqual(
      [
        [PROF.JURISDICTION_NATIONAL, matricula, PROF.AUTH_PENDING],
        [PROF.JURISDICTION_SEDES_SANTA_CRUZ, sedes, PROF.AUTH_PENDING],
      ].sort(([a], [b]) => String(a).localeCompare(String(b))),
    );

    const archivos = await em.find(Files, { id: { $in: [matricula, sedes] } });
    expect(archivos).toHaveLength(2);
    for (const archivo of archivos) {
      expect(archivo.tenantId).toBe(SEED.tenantId);
      expect(archivo.createdByUserId).toBe(res.body.userId);
    }

    // El titular lo recupera en su propio resumen y puede bajarlo.
    const login = await http()
      .post('/iam/auth/login')
      .send({ email, password: 'S3cret-passw0rd' })
      .expect(200);
    const token = login.body.accessToken as string;
    const propio = await http()
      .get('/profiles/practitioners/me/summary')
      .set(bearer(token))
      .expect(200);
    expect(
      (propio.body.licenses as { fileId?: string }[])
        .map((l) => l.fileId)
        .sort(),
    ).toEqual([matricula, sedes].sort());
    await http()
      .get(`/common/files/${matricula}/content`)
      .set(bearer(token))
      .expect(200);

    // La ficha que ve un tercero no trae el archivo.
    const ajena = await http()
      .get(`/profiles/practitioners/${res.body.practitionerProfileId}/summary`)
      .set(bearer(ctx.adminToken))
      .expect(200);
    for (const license of ajena.body.licenses) {
      expect(license).not.toHaveProperty('fileId');
    }

    // Negativo de autorización: otra cuenta no puede leer el respaldo ajeno…
    const otroEmail = `matricula-otro-${marca}@example.test`;
    const otra = await alta(otroEmail, {}).expect(201);
    creados.push({ userId: otra.body.userId, personId: otra.body.personId });
    const otroLogin = await http()
      .post('/iam/auth/login')
      .send({ email: otroEmail, password: 'S3cret-passw0rd' })
      .expect(200);
    await http()
      .get(`/common/files/${matricula}/content`)
      .set(bearer(otroLogin.body.accessToken as string))
      .expect(403);

    // …ni colgarlo de su propia alta: el archivo ya tiene dueño y el alta
    // entera se revierte, sin dejar una cuenta a medias.
    const reusoEmail = `matricula-reuso-${marca}@example.test`;
    const reuso = await alta(reusoEmail, { licenseFileId: matricula }).expect(
      422,
    );
    expect(reuso.body.code).toBe('PRECONDITION_FAILED');
    expect(
      await em.count(AuthenticationCredentials, {
        externalSubject: reusoEmail,
      }),
    ).toBe(0);
  });

  it('rechaza el PDF del SEDES sin su número y un archivo que no existe, sin crear cuenta', async () => {
    const sedes = await subirPdf(`sedes-solo-${marca}.pdf`);
    const sinNumero = `sedes-sin-numero-${marca}@example.test`;
    const r1 = await alta(sinNumero, { sedesLicenseFileId: sedes }).expect(422);
    expect(r1.body.code).toBe('PRECONDITION_FAILED');

    const inexistente = `matricula-inexistente-${marca}@example.test`;
    await alta(inexistente, { licenseFileId: randomUUID() }).expect((res) => {
      expect([404, 422]).toContain(res.status);
    });

    const em = ctx.orm.em.fork();
    expect(
      await em.count(AuthenticationCredentials, {
        externalSubject: { $in: [sinNumero, inexistente] },
      }),
    ).toBe(0);
    // El archivo que no se reclamó sigue sin dueño.
    const archivo = await em.findOneOrFail(Files, { id: sedes });
    expect(archivo.createdByUserId ?? null).toBeNull();
  });
});
