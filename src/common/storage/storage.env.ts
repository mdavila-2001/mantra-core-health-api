import * as Joi from 'joi';

/** Adaptadores de almacenamiento reconocidos por `FileStorageModule`. */
export const FILE_STORAGE_ADAPTERS = ['local'] as const;

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
}).unknown(true);

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
  };
}
