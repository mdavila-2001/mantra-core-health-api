import { randomBytes, randomUUID } from 'node:crypto';
import request from 'supertest';
import { bootstrapTestApp, bearer, type TestContext } from '../harness';
import { SEED } from '../../../src/common';
import {
  BUCKET,
  configureMinioFromEnv,
  ensureBucket,
  putObject,
  s3,
  seedNamespace,
  seedObject,
  sha256,
  sqlOf,
} from './object-storage.fixture';

/**
 * MCH-021 · cerrar una carga exige que los bytes existan y sean los declarados.
 *
 * Contra PostgreSQL y MinIO reales: el objeto se sube de verdad al bucket y la
 * carga se cierra por HTTP. Un mock del lector no probaría nada, porque lo que
 * se corrige es justamente que nadie miraba el proveedor.
 *
 * El manifiesto se siembra con una versión 1 por SQL: el esquema vigente tiene
 * `supersedes_version_id` NOT NULL, así que la primera versión creada por el
 * endpoint no se puede insertar (deuda aparte, anotada en el PR). Con una
 * versión previa, el cierre crea la 2 y el camino queda ejercido completo.
 */
describe('MCH-021 · integridad física al cerrar una carga (integración)', () => {
  let ctx: TestContext;
  const http = () => request(ctx.app.getHttpServer());
  let namespace: { id: string; code: string };

  beforeAll(async () => {
    configureMinioFromEnv();
    ctx = await bootstrapTestApp();
    await ensureBucket(s3());
    namespace = await seedNamespace(ctx);
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  async function iniciar(key: string, size: number): Promise<string> {
    const res = await http()
      .post(`/object-storage/namespaces/${namespace.code}/uploads/initiate`)
      .set(bearer(ctx.adminToken))
      .send({
        tenantId: SEED.tenantId,
        providerUploadId: `mch021-${randomUUID()}`,
        targetObjectKey: key,
        expectedSizeBytes: String(size),
      })
      .expect(201);
    return res.body.id as string;
  }

  function cerrar(
    uploadId: string,
    logicalObjectId: string,
    key: string,
    sha: string,
    size: number,
  ) {
    return http()
      .post(`/object-storage/uploads/${uploadId}/complete`)
      .set(bearer(ctx.adminToken))
      .send({
        logicalObjectId,
        objectType: 'document',
        sha256: sha,
        receivedSizeBytes: String(size),
        providerVersionId: 'declarada',
        etag: 'etag-declarado',
        mimeType: 'application/pdf',
        providerUri: `s3://${BUCKET}/${key}`,
        compression: 'none',
      });
  }

  async function versiones(manifestId: string) {
    return sqlOf(ctx)<{ id: string; version_number: number; etag: string }>(
      `SELECT id, version_number, etag FROM object_storage.object_versions
        WHERE object_manifest_id = ? ORDER BY version_number`,
      [manifestId],
    );
  }

  async function estadoCarga(uploadId: string) {
    const [row] = await sqlOf(ctx)<{ status: string }>(
      'SELECT status FROM object_storage.multipart_uploads WHERE id = ?',
      [uploadId],
    );
    return row.status;
  }

  it('AC01 · un SHA declarado que no es el de los bytes no se publica', async () => {
    const previo = await seedObject(ctx, namespace.id, {
      tenantId: SEED.tenantId,
      bytes: randomBytes(64),
    });
    const bytes = randomBytes(256);
    const otros = randomBytes(256);
    const key = `f06/${randomUUID()}`;
    await putObject(s3(), key, bytes);
    const uploadId = await iniciar(key, bytes.byteLength);

    await cerrar(
      uploadId,
      previo.logicalObjectId,
      key,
      sha256(otros),
      bytes.byteLength,
    ).expect(422);

    expect(await versiones(previo.manifestId)).toHaveLength(1);
    expect(await estadoCarga(uploadId)).toBe('initiated');
  });

  it('AC02 · un objeto que no está en el bucket no pasa a publicable', async () => {
    const previo = await seedObject(ctx, namespace.id, {
      tenantId: SEED.tenantId,
      bytes: randomBytes(64),
    });
    const bytes = randomBytes(128);
    const key = `f06/${randomUUID()}`; // nunca se sube
    const uploadId = await iniciar(key, bytes.byteLength);

    await cerrar(
      uploadId,
      previo.logicalObjectId,
      key,
      sha256(bytes),
      bytes.byteLength,
    ).expect(422);

    expect(await versiones(previo.manifestId)).toHaveLength(1);
    expect(await estadoCarga(uploadId)).toBe('initiated');
  });

  it('bytes de menos: el tamaño del proveedor manda, no el declarado', async () => {
    const previo = await seedObject(ctx, namespace.id, {
      tenantId: SEED.tenantId,
      bytes: randomBytes(64),
    });
    const bytes = randomBytes(100);
    const key = `f06/${randomUUID()}`;
    await putObject(s3(), key, bytes.subarray(0, 60));
    const uploadId = await iniciar(key, bytes.byteLength);

    await cerrar(
      uploadId,
      previo.logicalObjectId,
      key,
      sha256(bytes),
      bytes.byteLength,
    ).expect(422);
    expect(await versiones(previo.manifestId)).toHaveLength(1);
  });

  it('con los bytes correctos crea la versión con checksum del servidor', async () => {
    const previo = await seedObject(ctx, namespace.id, {
      tenantId: SEED.tenantId,
      bytes: randomBytes(64),
    });
    const bytes = randomBytes(512);
    const key = `f06/${randomUUID()}`;
    await putObject(s3(), key, bytes);
    const uploadId = await iniciar(key, bytes.byteLength);

    const res = await cerrar(
      uploadId,
      previo.logicalObjectId,
      key,
      sha256(bytes),
      bytes.byteLength,
    ).expect(201);

    expect(res.body.versionNumber).toBe(2);
    const [checksum] = await sqlOf(ctx)<{
      source: string;
      checksum: string;
      verification_status: string;
    }>(
      `SELECT source, checksum, verification_status
         FROM object_storage.object_checksums WHERE object_version_id = ?`,
      [res.body.versionId],
    );
    expect(checksum).toEqual({
      source: 'server',
      checksum: sha256(bytes),
      verification_status: 'verified',
    });
    // El ETag guardado es el del proveedor, no el que mandó el cliente.
    const filas = await versiones(previo.manifestId);
    expect(filas[1].etag).not.toBe('etag-declarado');
    expect(await estadoCarga(uploadId)).toBe('completed');
  });

  it('AC03 · un checksum sólo declarado por el cliente no habilita la descarga', async () => {
    const declarado = await seedObject(ctx, namespace.id, {
      tenantId: SEED.tenantId,
      bytes: randomBytes(64),
      checksumSource: 'client',
    });

    await http()
      .post(`/object-storage/versions/${declarado.versionId}/signed-url`)
      .set(bearer(ctx.adminToken))
      .send({ purposeOfUseCode: 'TREATMENT' })
      .expect(422);
  });
});
