import request from 'supertest';
import { MikroORM } from '@mikro-orm/postgresql';
import { bootstrapTestApp, bearer, type TestContext } from './harness';
import { Files, Identifiers } from '../../src/modules/common/entities';
import { CONCEPTS } from '../../src/common';

/**
 * Pruebas de integración del módulo Common: identificadores, contactos,
 * direcciones y el ciclo de vida gobernado de archivos (versión, escaneo,
 * derivado, vínculo, URL firmada, borrado lógico) contra la base real.
 */
describe('Common (integración)', () => {
  let ctx: TestContext;
  let orm: MikroORM;
  const uniq = Date.now();
  let contactPointId: string;
  let fileId: string;
  let versionId: string;

  beforeAll(async () => {
    ctx = await bootstrapTestApp();
    orm = ctx.orm;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  /**
   * Ejecuta la operación http.
   * @returns Resultado de http.
   */
  const http = () => request(ctx.app.getHttpServer());
  /**
   * Ejecuta la operación owner.
   * @returns Resultado de owner.
   */
  const owner = () => ({ ownerType: 'USER', ownerId: ctx.adminUserId });

  it('UC-02-01 crea un identificador y lo persiste', async () => {
    const res = await http()
      .post('/common/identifiers')
      .set(bearer(ctx.adminToken))
      .send({
        ...owner(),
        type: 'NATIONAL_ID',
        system: `urn:pe:dni:${uniq}`,
        value: '12345678',
        use: 'OFFICIAL',
      })
      .expect(201);
    const em = orm.em.fork();
    const persisted = await em.findOne(Identifiers, { id: res.body.id });
    expect(persisted).not.toBeNull();
  });

  it('UC-02-01 rechaza identificador duplicado (409)', async () => {
    await http()
      .post('/common/identifiers')
      .set(bearer(ctx.adminToken))
      .send({
        ...owner(),
        type: 'NATIONAL_ID',
        system: `urn:pe:dni:${uniq}`,
        value: '12345678',
      })
      .expect(409);
  });

  it('UC-02-02/03 crea y verifica un punto de contacto', async () => {
    const created = await http()
      .post('/common/contact-points')
      .set(bearer(ctx.adminToken))
      .send({
        ...owner(),
        system: 'EMAIL',
        value: `c-${uniq}@example.com`,
        use: 'HOME',
      })
      .expect(201);
    contactPointId = created.body.id;
    const verified = await http()
      .post(`/common/contact-points/${contactPointId}/verify`)
      .set(bearer(ctx.adminToken))
      .send({ code: '123456' })
      .expect(200);
    expect(verified.body.verified).toBe(true);
  });

  it('UC-02-04 crea una dirección', async () => {
    await http()
      .post('/common/addresses')
      .set(bearer(ctx.adminToken))
      .send({
        ...owner(),
        lines: ['Av. Siempre Viva 742'],
        city: 'Lima',
        postalCode: '15001',
        country: 'PE',
      })
      .expect(201);
  });

  it('UC-02-05 sube un archivo con versión inicial', async () => {
    const res = await http()
      .post('/common/files')
      .set(bearer(ctx.adminToken))
      .send({
        originalName: 'report.pdf',
        category: 'DOCUMENT',
        sensitivity: 'PHI',
        mimeType: 'application/pdf',
        sizeBytes: 20480,
        contentHash: 'a'.repeat(64),
        storageUri: `s3://bucket/report-${uniq}.pdf`,
      })
      .expect(201);
    fileId = res.body.id;
    versionId = res.body.currentVersionId;
    expect(fileId).toEqual(expect.any(String));
    expect(versionId).toEqual(expect.any(String));

    const em = orm.em.fork();
    const persisted = await em.findOne(Files, { id: fileId });
    expect(persisted!.lifecycleStatusConceptId).toBe(CONCEPTS.FILE_ACTIVE);
  });

  it('UC-02-09 registra resultado de escaneo (CLEAN)', async () => {
    await http()
      .post(`/internal/files/versions/${versionId}/scan-result`)
      .set(bearer(ctx.adminToken))
      .send({ result: 'CLEAN' })
      .expect(200);
  });

  it('UC-02-07 genera un derivado desde una versión limpia', async () => {
    await http()
      .post(`/common/files/${fileId}/versions/${versionId}/derivatives`)
      .set(bearer(ctx.adminToken))
      .send({
        derivativeType: 'THUMBNAIL',
        storageUri: `s3://bucket/thumb-${uniq}.png`,
        mimeType: 'image/png',
        sizeBytes: 2048,
        contentHash: 'c'.repeat(64),
      })
      .expect(201);
  });

  it('UC-02-08 vincula el archivo a una entidad', async () => {
    await http()
      .post(`/common/files/${fileId}/links`)
      .set(bearer(ctx.adminToken))
      .send({
        ownerType: 'PATIENT',
        ownerId: ctx.adminUserId,
        linkRole: 'ATTACHMENT',
        visibility: 'INTERNAL',
      })
      .expect(201);
  });

  it('UC-02-11 emite una URL firmada de descarga', async () => {
    const res = await http()
      .post(`/common/files/${fileId}/download-url`)
      .set(bearer(ctx.adminToken))
      .expect(201);
    expect(res.body.url).toEqual(expect.any(String));
    expect(res.body.expiresAt).toEqual(expect.any(String));
  });

  it('UC-02-06 agrega una nueva versión', async () => {
    await http()
      .post(`/common/files/${fileId}/versions`)
      .set(bearer(ctx.adminToken))
      .send({
        mimeType: 'application/pdf',
        sizeBytes: 20500,
        contentHash: 'b'.repeat(64),
        storageUri: `s3://bucket/report-v2-${uniq}.pdf`,
      })
      .expect(201);
  });

  it('UC-02-10 borra el archivo (soft-delete)', async () => {
    const res = await http()
      .delete(`/common/files/${fileId}`)
      .set(bearer(ctx.adminToken))
      .expect(200);
    expect(res.body.deletedAt).toEqual(expect.any(String));
    const em = orm.em.fork();
    const persisted = await em.findOne(Files, { id: fileId });
    expect(persisted!.lifecycleStatusConceptId).toBe(CONCEPTS.FILE_DELETED);
  });

  it('rechaza sin autenticación (401)', async () => {
    await http()
      .post('/common/identifiers')
      .send({ ...owner(), type: 'MRN', value: 'x' })
      .expect(401);
  });
});
