/**
 * Constantes del motor de cargas masivas (`bulk_import`).
 *
 * Los topes son del contrato (PLAN H7: 5.000 filas y 20 MB) y se leen desde
 * acá en un solo lugar: el controlador, el analizador y las plantillas
 * (`rules`) citan el mismo número, así que no pueden divergir.
 */

/** Topes de una carga. */
export const BULK_IMPORT_LIMITS = {
  /** Tamaño máximo del archivo subido, en bytes (20 MB). */
  maxBytes: 20 * 1024 * 1024,
  /** Filas máximas por lote. */
  maxRows: 5_000,
  /** Errores que viajan en la vista previa (el recuento total va aparte). */
  maxPreviewIssues: 200,
  /** Largo máximo de una clave de idempotencia. */
  maxIdempotencyKeyLength: 128,
} as const;

/** Plazos del procesamiento asíncrono. */
export const BULK_IMPORT_TIMEOUTS = {
  /** Plazo de una fila (resolver paciente, resolver códigos, escribir). */
  rowMs: 10_000,
  /** Plazo de todo el lote. */
  batchMs: 10 * 60_000,
  /** Intentos por fila ante un error transitorio. */
  rowAttempts: 2,
} as const;

/**
 * Permisos finos del motor. Se modelan en el authz existente como filas de
 * `authz.permissions` (`resource` = este valor, acción `EXECUTE`) concedidas
 * por `authz.user_permission_grants` o por rol: no hay tablas nuevas.
 */
export const BULK_IMPORT_PERMISSIONS = {
  users: 'bulk_import.users',
  clinical: 'bulk_import.clinical',
} as const;

/** Un permiso fino del motor. */
export type BulkImportPermission =
  (typeof BULK_IMPORT_PERMISSIONS)[keyof typeof BULK_IMPORT_PERMISSIONS];

/** Roles de gestión que pueden llegar al motor (además del permiso fino). */
export const BULK_IMPORT_MANAGEMENT_ROLES = [
  'SECURITY_ADMIN',
  'PLATFORM_ADMIN',
] as const;

/** Familia de una carga. */
export type BulkImportGroup = 'USERS' | 'CLINICAL';

/** Estados de un lote. Las transiciones válidas están en `BATCH_TRANSITIONS`. */
export enum BulkImportStatus {
  /** El archivo pasó la validación; espera la confirmación. */
  VALIDATED = 'VALIDADO',
  /** La validación no dejó ninguna fila aceptable (o el archivo no se pudo leer). */
  REJECTED = 'RECHAZADO',
  /** Confirmado; espera su turno de procesamiento. */
  QUEUED = 'EN_COLA',
  /** Se está escribiendo. */
  PROCESSING = 'PROCESANDO',
  /** Terminó (con o sin filas rechazadas u omitidas). */
  COMPLETED = 'COMPLETADO',
  /** No pudo terminar (plazo del lote agotado o error del procesador). */
  FAILED = 'FALLIDO',
}

/**
 * Transiciones permitidas. La escritura del estado compara contra el estado
 * esperado (`transition(id, from, to)`): la precondición viaja en el `UPDATE`,
 * no en un `if` previo.
 */
export const BATCH_TRANSITIONS: Readonly<
  Record<BulkImportStatus, readonly BulkImportStatus[]>
> = {
  [BulkImportStatus.VALIDATED]: [BulkImportStatus.QUEUED],
  [BulkImportStatus.REJECTED]: [],
  [BulkImportStatus.QUEUED]: [BulkImportStatus.PROCESSING],
  [BulkImportStatus.PROCESSING]: [
    BulkImportStatus.COMPLETED,
    BulkImportStatus.FAILED,
  ],
  [BulkImportStatus.COMPLETED]: [],
  [BulkImportStatus.FAILED]: [],
};

/** Resultado de una fila en el informe. */
export enum RowOutcome {
  /** Se escribió. */
  CREATED = 'CREADA',
  /** Ya existía exactamente igual: no se escribió nada. */
  SKIPPED = 'OMITIDA',
  /** Existía distinto: se reporta y no se sobrescribe. */
  CONFLICT = 'CONFLICTO',
  /** No pasó la validación, o no se pudo resolver su paciente/código. */
  REJECTED = 'RECHAZADA',
  /** Falló al escribir (error del colaborador o plazo). */
  FAILED = 'FALLIDA',
  /** El lote se cortó antes de llegar a esta fila. */
  NOT_PROCESSED = 'NO_PROCESADA',
}

/** Formatos de archivo y de plantilla. */
export const BULK_IMPORT_FORMATS = ['csv', 'json'] as const;
/** Un formato admitido. */
export type BulkImportFormat = (typeof BULK_IMPORT_FORMATS)[number];
