import {
  CreateBucketCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { createHash, randomUUID } from 'node:crypto';
import type { TestContext } from '../harness';

/**
 * Apoyo común de las pruebas de F06 (MCH-009/010/020/021) contra MinIO y
 * PostgreSQL reales.
 *
 * El stack local expone MinIO con las variables `MINIO_*`; el backend lee la
 * conexión S3 de `FILE_STORAGE_S3_*`. Se traducen antes de levantar la app. El
 * adaptador de archivos (`FILE_STORAGE_ADAPTER`) no se toca: el catálogo de
 * objetos usa su propio lector y el bucket del espacio de nombres.
 */
export function configureMinioFromEnv(): void {
  const host = process.env.MINIO_ENDPOINT ?? 'localhost';
  const port = process.env.MINIO_PORT ?? '9000';
  process.env.FILE_STORAGE_S3_ENDPOINT = `http://${host}:${port}`;
  process.env.FILE_STORAGE_S3_FORCE_PATH_STYLE = 'true';
  process.env.FILE_STORAGE_S3_ACCESS_KEY_ID = process.env.MINIO_ACCESS_KEY;
  process.env.FILE_STORAGE_S3_SECRET_ACCESS_KEY = process.env.MINIO_SECRET_KEY;
}

export const BUCKET = process.env.MINIO_BUCKET ?? 'mantra-redesa-health-files';

export function s3(): S3Client {
  return new S3Client({
    region: process.env.FILE_STORAGE_S3_REGION ?? 'us-east-1',
    endpoint: process.env.FILE_STORAGE_S3_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.MINIO_ACCESS_KEY ?? '',
      secretAccessKey: process.env.MINIO_SECRET_KEY ?? '',
    },
  });
}

export async function ensureBucket(client: S3Client): Promise<void> {
  try {
    await client.send(new HeadBucketCommand({ Bucket: BUCKET }));
  } catch {
    await client.send(new CreateBucketCommand({ Bucket: BUCKET }));
  }
}

export async function putObject(
  client: S3Client,
  key: string,
  body: Buffer,
): Promise<void> {
  await client.send(
    new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body }),
  );
}

export async function deleteObject(
  client: S3Client,
  key: string,
): Promise<void> {
  await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

export const sha256 = (bytes: Buffer): string =>
  createHash('sha256').update(bytes).digest('hex');

export function sqlOf(ctx: TestContext) {
  return <T = Record<string, unknown>>(
    query: string,
    params: unknown[] = [],
  ): Promise<T[]> =>
    ctx.orm.em.fork().getConnection().execute<T[]>(query, params);
}

/** Espacio de nombres sobre el bucket de MinIO, sin versionado (como el stack). */
export async function seedNamespace(ctx: TestContext): Promise<{
  id: string;
  code: string;
}> {
  const id = randomUUID();
  const code = `f06-${id.slice(0, 8)}`;
  await sqlOf(ctx)(
    `INSERT INTO object_storage.object_namespaces
       (id, code, backend_code, region_code, bucket_or_container,
        object_key_prefix, default_storage_class, versioning_enabled,
        object_lock_enabled, state)
     VALUES (?, ?, 'minio', 'local', ?, 'f06/', 'standard', false, false, 'active')`,
    [id, code, BUCKET],
  );
  return { id, code };
}

/**
 * Siembra por SQL un objeto con una versión y sus bytes en MinIO.
 *
 * `checksumSource` decide si la versión llega verificada por el servidor o
 * sólo declarada por el cliente (el estado previo a MCH-021). La versión se
 * declara a sí misma como `supersedes`: la columna es NOT NULL en el esquema
 * vigente y la primera versión no tiene a quién desplazar.
 */
export async function seedObject(
  ctx: TestContext,
  namespaceId: string,
  opts: {
    tenantId: string;
    patientProfileId?: string | null;
    bytes: Buffer;
    checksumSource?: 'server' | 'client';
    objectType?: string;
  },
): Promise<{
  manifestId: string;
  versionId: string;
  logicalObjectId: string;
  key: string;
}> {
  const sql = sqlOf(ctx);
  const manifestId = randomUUID();
  const versionId = randomUUID();
  const logicalObjectId = randomUUID();
  const key = `f06/${randomUUID()}`;
  const sha = sha256(opts.bytes);
  await putObject(s3(), key, opts.bytes);
  await sql(
    `INSERT INTO object_storage.object_manifests
       (id, tenant_id, namespace_id, logical_object_id, object_type,
        patient_profile_id, current_version_id, lifecycle_state,
        retention_policy_code, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'active', 'default', now(), now())`,
    [
      manifestId,
      opts.tenantId,
      namespaceId,
      logicalObjectId,
      opts.objectType ?? 'document',
      opts.patientProfileId ?? null,
      versionId,
    ],
  );
  await sql(
    `INSERT INTO object_storage.object_versions
       (id, object_manifest_id, version_number, provider_version_id, object_key,
        mime_type, size_bytes, sha256, etag, compression, created_at,
        supersedes_version_id)
     VALUES (?, ?, 1, 'sin-version', ?, 'application/pdf', ?, ?, 'etag', 'none', now(), ?)`,
    [versionId, manifestId, key, opts.bytes.byteLength, sha, versionId],
  );
  await sql(
    `INSERT INTO object_storage.object_checksums
       (id, object_version_id, algorithm, checksum, source, verified_at, verification_status)
     VALUES (?, ?, 'SHA256', ?, ?, now(), 'verified')`,
    [randomUUID(), versionId, sha, opts.checksumSource ?? 'server'],
  );
  await sql(
    `INSERT INTO object_storage.object_locations
       (id, object_version_id, namespace_id, placement_role, provider_uri,
        storage_class, replication_state, verified_at)
     VALUES (?, ?, ?, 'primary', ?, 'standard', 'pending', null)`,
    [randomUUID(), versionId, namespaceId, `s3://${BUCKET}/${key}`],
  );
  return { manifestId, versionId, logicalObjectId, key };
}
