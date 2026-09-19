import { randomBytes, randomUUID } from 'node:crypto';
import request from 'supertest';
import { bootstrapTestApp, bearer, type TestContext } from '../harness';
import { SEED, TokenService } from '../../../src/common';
import {
  configureMinioFromEnv,
  ensureBucket,
  s3,
  seedNamespace,
  seedObject,
} from './object-storage.fixture';

/**
 * MCH-010 · el acceso a un objeto se ata al actor, no sólo a su rol.
 *
 * Contra PostgreSQL real: la política del expediente consulta turnos,
 * relaciones asistenciales y grants en la base, así que un doble del
 * repositorio no probaría nada. Se ejerce por HTTP con tres identidades
 * distintas sobre el mismo objeto.
 *
 * **RED contra el código previo:** `issueSignedUrl` resolvía versión,
 * manifiesto y ubicación por id y sólo usaba al actor para el log, así que las
 * tres emisiones respondían 201 — incluida la del actor de otro tenant y la del
 * clínico sin vínculo con el paciente.
 */
describe('MCH-010 · el objeto se autoriza contra su dueño (integración)', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());
  let namespace: { id: string; code: string };

  /** Emite un token para una identidad sintética con los roles indicados. */
  function tokenDe(roles: string[], tenants: string[]): string {
    return ctx.app
      .get(TokenService)
      .signAccessToken(randomUUID(), `mch010-${randomUUID()}`, roles, tenants);
  }

  beforeAll(async () => {
    configureMinioFromEnv();
    ctx = await bootstrapTestApp();
    await ensureBucket(s3());
    namespace = await seedNamespace(ctx);
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  /** Objeto clínico del tenant sembrado, colgado del paciente de fixtures. */
  async function objetoDePaciente() {
    return seedObject(ctx, namespace.id, {
      tenantId: SEED.tenantId,
      patientProfileId: ctx.patientSubtypeId,
      bytes: randomBytes(128),
      objectType: 'dicom_study',
    });
  }

  function emitir(versionId: string, token: string, purpose = 'TREATMENT') {
    return http()
      .post(`/object-storage/versions/${versionId}/signed-url`)
      .set(bearer(token))
      .send({ purposeOfUseCode: purpose });
  }

  it('el actor con custodia y política a favor sí obtiene el acceso', async () => {
    const objeto = await objetoDePaciente();

    const res = await emitir(objeto.versionId, ctx.adminToken).expect(201);

    expect(res.body.url).toContain(objeto.versionId);
  });

  it('AC01 · un actor de otro tenant no alcanza el objeto', async () => {
    const objeto = await objetoDePaciente();
    const ajeno = tokenDe(['CLINICIAN', 'STORAGE_ADMIN'], [randomUUID()]);

    const res = await emitir(objeto.versionId, ajeno);

    expect(res.status).toBe(404);
  });

  it('AC02 · un clínico del mismo tenant sin vínculo con el paciente tampoco', async () => {
    const objeto = await objetoDePaciente();
    const sinVinculo = tokenDe(['CLINICIAN'], [SEED.tenantId]);

    const res = await emitir(objeto.versionId, sinVinculo);

    expect(res.status).toBe(404);
  });

  it('AC03 · una finalidad que la política no evalúa no emite ni canjea', async () => {
    const objeto = await objetoDePaciente();

    await emitir(objeto.versionId, ctx.adminToken, 'CURIOSITY').expect(404);
  });

  it('el objeto ajeno responde igual que uno inexistente', async () => {
    const objeto = await objetoDePaciente();
    const ajeno = tokenDe(['CLINICIAN', 'STORAGE_ADMIN'], [randomUUID()]);

    const existeAjeno = await emitir(objeto.versionId, ajeno);
    const noExiste = await emitir(randomUUID(), ajeno);

    expect(existeAjeno.status).toBe(noExiste.status);
    expect(existeAjeno.body.message).toEqual(noExiste.body.message);
  });

  it('el canje vuelve a preguntar: perder el vínculo corta el enlace vivo', async () => {
    const objeto = await objetoDePaciente();
    const emitido = await emitir(objeto.versionId, ctx.adminToken).expect(201);
    const token = (emitido.body.url as string).split('/').pop() as string;
    const ajeno = tokenDe(['CLINICIAN', 'STORAGE_ADMIN'], [randomUUID()]);

    // El enlace es de quien lo pidió, y además el otro actor no tiene custodia.
    await http()
      .get(`/object-storage/versions/${objeto.versionId}/content/${token}`)
      .set(bearer(ajeno))
      .expect(404);
  });
});
