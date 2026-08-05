import * as Joi from 'joi';

/** Adaptadores de almacenamiento reconocidos por `FileStorageModule`. */
export const FILE_STORAGE_ADAPTERS = ['local', 's3'] as const;

/**
 * Define el tipo de dominio file storage adapter name.
 */
export type FileStorageAdapterName = (typeof FILE_STORAGE_ADAPTERS)[number];

/** 10 MiB: suficiente para una foto de carnet desde un móvil, acotado. */
const DEFAULT_MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/**
 * Esquema de entorno del subsistema de archivos. Se concatena al esquema global
 * en `AppModule`: un adaptador mal escrito o un tamaño máximo inválido abortan
 * el arranque, no la primera subida.
 *
 * `FILE_STORAGE_ADAPTER` existe desde el primer día aunque hoy sólo acepte
 * `local`, para que añadir S3 sea implementar un adaptador y ampliar la lista —
 * no reescribir a los llamadores. Es el mismo criterio que el `providerAdapter`
 * mutable de los workers.
 */
export const storageEnvSchema = Joi.object({
  FILE_STORAGE_ADAPTER: Joi.string()
    .valid(...FILE_STORAGE_ADAPTERS)
    .default('local'),
  FILE_STORAGE_LOCAL_DIR: Joi.string().default('./storage/uploads'),
  FILE_STORAGE_MAX_SIZE_BYTES: Joi.number()
    .integer()
    .min(1)
    .default(DEFAULT_MAX_UPLOAD_BYTES),
  // Credenciales del bucket. Se exigen sólo con el adaptador `s3` activo: pedirlas siempre
  // rompería el arranque en local, donde no hace falta ningún bucket.
  MINIO_ENDPOINT: Joi.string().when('FILE_STORAGE_ADAPTER', {
    is: 's3',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  MINIO_PORT: Joi.number().integer().min(1).max(65535).default(9000),
  MINIO_ACCESS_KEY: Joi.string().when('FILE_STORAGE_ADAPTER', {
    is: 's3',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  MINIO_SECRET_KEY: Joi.string().when('FILE_STORAGE_ADAPTER', {
    is: 's3',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  MINIO_BUCKET: Joi.string().default('mantra-redesa-health-files'),
  MINIO_REGION: Joi.string().default('us-east-1'),
  MINIO_USE_SSL: Joi.boolean().default(false),
}).unknown(true);

/** Configuración del bucket compatible con S3. */
export interface S3StorageEnv {
  /**
   * URL completa del endpoint, ya compuesta desde host, puerto y esquema.
   */
  endpoint: string;
  /**
   * Bucket donde viven los objetos.
   */
  bucket: string;
  /**
   * Región declarada; MinIO la ignora pero el SDK la exige.
   */
  region: string;
  /**
   * Clave de acceso.
   */
  accessKeyId: string;
  /**
   * Clave secreta.
   */
  secretAccessKey: string;
  /**
   * `true` para direccionar el bucket por ruta y no por subdominio, que es lo
   * único que entiende MinIO.
   */
  forcePathStyle: boolean;
}

/**
 * Describe el contrato estructural de storage env.
 */
export interface StorageEnv {
  /**
   * Adaptador de almacenamiento activo.
   */
  adapter: FileStorageAdapterName;
  /**
   * Directorio raíz del adaptador `local`.
   */
  localDir: string;
  /**
   * Tamaño máximo aceptado en una subida, en bytes.
   */
  maxSizeBytes: number;
  /**
   * Configuración del adaptador `s3`.
   */
  s3: S3StorageEnv;
}

/** Lee la configuración de almacenamiento desde `process.env`. */
export function loadStorageEnv(): StorageEnv {
  const adapter = (process.env.FILE_STORAGE_ADAPTER ??
    'local') as FileStorageAdapterName;
  return {
    adapter,
    localDir: process.env.FILE_STORAGE_LOCAL_DIR ?? './storage/uploads',
    maxSizeBytes: Number(
      process.env.FILE_STORAGE_MAX_SIZE_BYTES ?? DEFAULT_MAX_UPLOAD_BYTES,
    ),
    s3: {
      // El endpoint se compone aquí y no se pide ya formado porque el resto del stack
      // (workers, mock-provider) comparte `MINIO_ENDPOINT`/`MINIO_PORT` sueltos.
      endpoint: `${process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http'}://${
        process.env.MINIO_ENDPOINT ?? 'localhost'
      }:${process.env.MINIO_PORT ?? '9000'}`,
      bucket: process.env.MINIO_BUCKET ?? 'mantra-redesa-health-files',
      region: process.env.MINIO_REGION ?? 'us-east-1',
      accessKeyId: process.env.MINIO_ACCESS_KEY ?? '',
      secretAccessKey: process.env.MINIO_SECRET_KEY ?? '',
      forcePathStyle: true,
    },
  };
}
