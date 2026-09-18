/**
 * Estados de `object_storage.*`.
 *
 * A diferencia de los módulos clínicos y operativos, este esquema **no usa
 * `*_concept_id`**: sus columnas de estado son `varchar`. No es un descuido del
 * modelo — son estados de infraestructura de almacenamiento, no vocabulario
 * clínico gobernado, y no tienen por qué vivir en `terminology`.
 *
 * Se recogen aquí como constantes por la misma razón por la que existen los
 * conceptos: para que ningún literal suelto se escape a un servicio y nadie
 * escriba `'ACTIVE'` donde el modelo dice `'active'`.
 *
 * Todos los valores salen de las notas del caso de uso 60; no se inventa
 * ninguno.
 */

/** Ciclo de vida del objeto lógico (`object_manifests.lifecycle_state`). */
export const OBJECT_LIFECYCLE = {
  ACTIVE: 'active',
  /** Con retención vigente: no se puede borrar hasta que venza. */
  RETAINED: 'retained',
  /** Bajo retención legal: anula cualquier borrado, incluso vencida la retención. */
  LEGAL_HOLD: 'legal_hold',
  ARCHIVED: 'archived',
  /** La verificación de integridad no cuadró. */
  CORRUPT: 'corrupt',
  PENDING_DELETION: 'pending_deletion',
} as const;

/**
 * Define el tipo de dominio object lifecycle.
 */
export type ObjectLifecycle =
  (typeof OBJECT_LIFECYCLE)[keyof typeof OBJECT_LIFECYCLE];

/** Estado de la carga multiparte (`multipart_uploads.status`). */
export const UPLOAD_STATUS = {
  INITIATED: 'initiated',
  COMPLETED: 'completed',
} as const;

/** Modo del bloqueo de retención (`object_retention_locks.lock_mode`). */
export const RETENTION_LOCK_MODE = {
  /** WORM inmutable: no se acorta ni se libera antes de `retain_until`. */
  COMPLIANCE: 'compliance',
  /** Admite liberación anticipada por quien tenga el permiso. */
  GOVERNANCE: 'governance',
} as const;

/**
 * Define el tipo de dominio retention lock mode.
 */
export type RetentionLockMode =
  (typeof RETENTION_LOCK_MODE)[keyof typeof RETENTION_LOCK_MODE];

/** Estado de la retención legal (`object_legal_holds.hold_state`). */
export const LEGAL_HOLD_STATE = {
  ACTIVE: 'active',
  RELEASED: 'released',
} as const;

/** Papel de la ubicación (`object_locations.placement_role`). */
export const PLACEMENT_ROLE = {
  PRIMARY: 'primary',
  ARCHIVE: 'archive',
} as const;

/** Estado de replicación de una ubicación (`object_locations.replication_state`). */
export const REPLICATION_STATE = {
  PENDING: 'pending',
  VERIFIED: 'verified',
} as const;

/** Clases de almacenamiento que el caso de uso nombra explícitamente. */
export const STORAGE_CLASS = {
  GLACIER: 'glacier',
  COLD: 'cold',
} as const;

/** Clases frías: no se sirven directamente, hay que rehidratarlas antes. */
export const COLD_STORAGE_CLASSES: readonly string[] = [
  STORAGE_CLASS.GLACIER,
  STORAGE_CLASS.COLD,
];

/** Verificación del checksum (`object_checksums.verification_status`). */
export const CHECKSUM_VERIFICATION = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  MISMATCH: 'mismatch',
} as const;

/** Algoritmo y origen del checksum que el caso de uso declara. */
export const CHECKSUM_ALGORITHM_SHA256 = 'SHA256';
export const CHECKSUM_SOURCE_CLIENT = 'client';
export const CHECKSUM_SOURCE_SCAN = 'scan';
/**
 * El servidor leyó los bytes del proveedor y calculó el hash (MCH-021). Junto
 * con `scan` —el verificador de integridad— son los únicos orígenes que
 * habilitan servir una versión: `client` es sólo lo que alguien declaró.
 */
export const CHECKSUM_SOURCE_SERVER = 'server';
export const CHECKSUM_SOURCES_TRUSTED: readonly string[] = [
  CHECKSUM_SOURCE_SERVER,
  CHECKSUM_SOURCE_SCAN,
];

/**
 * Acceso temporal a una versión (MCH-009).
 *
 * El enlace que se emite es un canje contra este servicio, no la URI del
 * proveedor: así el acceso se revoca cerrando el objeto y no hay que esperar a
 * que caduque una firma emitida por S3. El tope de vida es corto a propósito —
 * es PHI saliendo de nuestro control— y el mínimo lo impone el DTO.
 */
export const SIGNED_ACCESS = {
  /** Vida por defecto cuando el cliente no pide ninguna. */
  DEFAULT_SECONDS: 300,
  /** Tope duro: lo que el cliente pida por encima se recorta a esto. */
  MAX_SECONDS: 900,
  /** Única operación que el enlace habilita. */
  METHOD: 'GET',
  /** Variable con el secreto de firma; comparte el de las URL de descarga. */
  SECRET_ENV: 'DOWNLOAD_URL_SECRET',
  /** Valor público de desarrollo, igual que en el servicio de archivos. */
  INSECURE_DEV_SECRET: 'alovida-dev-download-secret',
} as const;

/** Comprobación de integridad (`object_integrity_checks`). */
export const INTEGRITY_CHECK = {
  TYPE_SHA256_SCAN: 'sha256_scan',
  PASSED: 'passed',
  FAILED: 'failed',
} as const;

/** Verificación del marcador de borrado (`object_deletion_markers.verification_status`). */
export const DELETION_VERIFICATION = {
  PENDING: 'pending',
} as const;

/** Ciclo de vida del estudio DICOM (`dicom_study_manifests.lifecycle_state`). */
export const DICOM_STUDY_LIFECYCLE = {
  AVAILABLE: 'available',
} as const;

/** Desenlace del acceso DICOMweb (`dicomweb_access_logs.outcome`). */
export const DICOMWEB_OUTCOME = {
  ALLOWED: 'allowed',
  DENIED: 'denied',
} as const;

/** Operaciones DICOMweb que el caso de uso nombra. */
export const DICOMWEB_OPERATION = {
  WADO_RS: 'wado-rs',
  WADO_URI: 'wado-uri',
  QIDO_RS: 'qido-rs',
  STOW_RS: 'stow-rs',
} as const;

/** Estado activo de un namespace (`object_namespaces.state`). */
export const NAMESPACE_ACTIVE = 'active';
