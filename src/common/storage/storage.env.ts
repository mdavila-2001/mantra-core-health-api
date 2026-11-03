import * as Joi from 'joi';
import type { PhysicalStorageBinding } from './physical-object-identity';

/** Adaptadores de almacenamiento reconocidos por `FileStorageModule`. */
export const FILE_STORAGE_ADAPTERS = ['local', 's3'] as const;
export type FileStorageAdapterName = (typeof FILE_STORAGE_ADAPTERS)[number];
const DEFAULT_MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const storageEnvSchema = Joi.object({
  FILE_STORAGE_ADAPTER: Joi.string()
    .valid(...FILE_STORAGE_ADAPTERS)
    .default('local'),
  FILE_STORAGE_LOCAL_DIR: Joi.string().default('./storage/uploads'),
  FILE_STORAGE_MAX_SIZE_BYTES: Joi.number()
    .integer()
    .min(1)
    .default(DEFAULT_MAX_UPLOAD_BYTES),
  // Con el adaptador `s3` el bucket es obligatorio: sin él, la API arrancaba y
  // sólo fallaba en la primera subida (CIF-01). Con `local` se ignora.
  FILE_STORAGE_S3_BUCKET: Joi.string()
    .default('')
    .when('FILE_STORAGE_ADAPTER', {
      is: 's3',
      then: Joi.string().trim().min(1).required(),
      otherwise: Joi.string().allow(''),
    }),
  FILE_STORAGE_S3_REGION: Joi.string().default('us-east-1'),
  FILE_STORAGE_S3_ENDPOINT: Joi.string().uri().allow('').default(''),
  FILE_STORAGE_S3_FORCE_PATH_STYLE: Joi.boolean().default(false),
  FILE_STORAGE_S3_PREFIX: Joi.string().max(256).allow('').default('uploads'),
  FILE_STORAGE_S3_ACCESS_KEY_ID: Joi.string().allow('').default(''),
  FILE_STORAGE_S3_SECRET_ACCESS_KEY: Joi.string().allow('').default(''),
  FILE_STORAGE_LIFECYCLE_BINDING: Joi.string().allow('').default(''),
  FILE_STORAGE_LIFECYCLE_QUEUE_CODE: Joi.string()
    .max(120)
    .allow('')
    .default(''),
})
  .unknown(true)
  // Credenciales estáticas: o el par completo, o ninguna (cadena por defecto de
  // AWS: rol IAM, perfil, identidad de workload). Una sola mitad nunca es un modo
  // válido y hoy se descartaba en silencio.
  .custom((value: Record<string, unknown>, helpers) => {
    const accessKey = value.FILE_STORAGE_S3_ACCESS_KEY_ID;
    const secret = value.FILE_STORAGE_S3_SECRET_ACCESS_KEY;
    if (Boolean(accessKey) !== Boolean(secret)) {
      return helpers.message({
        custom:
          'FILE_STORAGE_S3_ACCESS_KEY_ID y FILE_STORAGE_S3_SECRET_ACCESS_KEY ' +
          'se definen juntas o ninguna (sin ellas se usa la cadena de ' +
          'credenciales del entorno, p. ej. un rol IAM)',
      });
    }
    return value;
  });

export interface StorageEnv {
  /** No binding is no proof of identity; it never grants a destructive operation. */
  lifecycleBinding?: PhysicalStorageBinding;
  adapter: FileStorageAdapterName;
  localDir: string;
  maxSizeBytes: number;
  s3: {
    bucket: string;
    region: string;
    endpoint: string;
    forcePathStyle: boolean;
    prefix: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
}

/** Lee la configuración de storage sin exponer credenciales en logs. */
export function loadStorageEnv(): StorageEnv {
  return {
    lifecycleBinding: loadPhysicalBinding(),
    adapter: (process.env.FILE_STORAGE_ADAPTER ??
      'local') as FileStorageAdapterName,
    localDir: process.env.FILE_STORAGE_LOCAL_DIR ?? './storage/uploads',
    maxSizeBytes: Number(
      process.env.FILE_STORAGE_MAX_SIZE_BYTES ?? DEFAULT_MAX_UPLOAD_BYTES,
    ),
    s3: {
      bucket: process.env.FILE_STORAGE_S3_BUCKET ?? '',
      region: process.env.FILE_STORAGE_S3_REGION ?? 'us-east-1',
      endpoint: process.env.FILE_STORAGE_S3_ENDPOINT ?? '',
      forcePathStyle: process.env.FILE_STORAGE_S3_FORCE_PATH_STYLE === 'true',
      prefix: process.env.FILE_STORAGE_S3_PREFIX ?? 'uploads',
      accessKeyId: process.env.FILE_STORAGE_S3_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.FILE_STORAGE_S3_SECRET_ACCESS_KEY ?? '',
    },
  };
}

/**
 * Falla si el adaptador `s3` está seleccionado sin lo mínimo para operar.
 *
 * Es la misma regla que el esquema Joi, pero evaluable sobre `loadStorageEnv()`:
 * la fábrica de `FileStorageModule` la ejecuta al construir el proveedor, de modo
 * que los procesos que no pasan por `ConfigModule` (workers, CLI) también
 * abortan en el arranque y no en la primera operación de un usuario.
 *
 * Sólo nombra variables; nunca imprime valores ni credenciales.
 */
export function assertStorageEnvConfigured(env: StorageEnv): void {
  if (env.adapter !== 's3') return;
  if (!env.s3.bucket.trim()) {
    throw new Error(
      'FILE_STORAGE_S3_BUCKET es obligatorio para FILE_STORAGE_ADAPTER=s3',
    );
  }
  if (Boolean(env.s3.accessKeyId) !== Boolean(env.s3.secretAccessKey)) {
    throw new Error(
      'FILE_STORAGE_S3_ACCESS_KEY_ID y FILE_STORAGE_S3_SECRET_ACCESS_KEY se ' +
        'definen juntas o ninguna',
    );
  }
}

function loadPhysicalBinding(): PhysicalStorageBinding | undefined {
  const raw = process.env.FILE_STORAGE_LIFECYCLE_BINDING;
  if (!raw) return undefined;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object') throw new Error();
    return value as PhysicalStorageBinding;
  } catch {
    // Invalid deployment configuration must not silently disable the write guard.
    throw new Error('FILE_STORAGE_LIFECYCLE_BINDING is invalid');
  }
}
