/**
 * Estados de `polyglot_storage.*`.
 *
 * Como en `object_storage`, este esquema usa `varchar` y no `*_concept_id`: son
 * estados de gobierno de infraestructura, no vocabulario clínico. La diferencia
 * con aquel módulo es la **caja**: aquí el caso de uso los escribe en
 * mayúsculas (`ACTIVE`, `DRAFT`), y en el 60 en minúsculas (`active`,
 * `initiated`). Se respeta cada uno como está escrito, porque la comparación
 * contra la columna es literal.
 *
 * Todos los valores salen de las notas del caso de uso 54.
 */

/** Ciclo de vida del backend de almacenamiento (`storage_backends.state`). */
export const BACKEND_STATE = {
  REGISTERED: 'REGISTERED',
  ACTIVE: 'ACTIVE',
} as const;

/** Verificación de una capacidad declarada (`storage_capabilities.verification_status`). */
export const CAPABILITY_VERIFICATION = {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
} as const;

/** Ciclo de vida del dataset gobernado (`dataset_definitions.lifecycle_state`). */
export const DATASET_LIFECYCLE = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
} as const;

/** Estado de una versión de dataset o de esquema de colección. */
export const VERSION_STATE = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  SUPERSEDED: 'SUPERSEDED',
} as const;

/** Compatibilidad declarada de la versión (`dataset_versions.compatibility_mode`). */
export const COMPATIBILITY_MODE = {
  /** Primera versión: no hay nada con lo que ser compatible. */
  NONE: 'NONE',
  BACKWARD: 'BACKWARD',
  FORWARD: 'FORWARD',
  FULL: 'FULL',
} as const;

/**
 * Define el tipo de dominio compatibility mode.
 */
export type CompatibilityMode =
  (typeof COMPATIBILITY_MODE)[keyof typeof COMPATIBILITY_MODE];

/** Ciclo de vida de la colección física (`collection_definitions.lifecycle_state`). */
export const COLLECTION_LIFECYCLE = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
} as const;

/** Rigor de validación del esquema (`collection_schema_versions.validation_mode`). */
export const VALIDATION_MODE = {
  STRICT: 'STRICT',
  LENIENT: 'LENIENT',
} as const;

/**
 * Define el tipo de dominio schema validation mode.
 */
export type SchemaValidationMode =
  (typeof VALIDATION_MODE)[keyof typeof VALIDATION_MODE];

/**
 * Ciclo de vida de la colocación (`dataset_placements.state`).
 *
 * `APPROVED` significa que pasó las cuatro comprobaciones de gobierno;
 * `ACTIVATED`, que además hay un tenant escribiendo en ella.
 */
export const PLACEMENT_STATE = {
  APPROVED: 'APPROVED',
  ACTIVATED: 'ACTIVATED',
  /** Su región dejó de responder y el tráfico se movió al secundario. */
  DEGRADED: 'DEGRADED',
  /** La proyección no cuadra con la fuente canónica: deja de servirse. */
  QUARANTINED: 'QUARANTINED',
} as const;

/** Papel de la colocación dentro del dataset. */
export const PLACEMENT_ROLE = {
  PRIMARY: 'PRIMARY',
  SECONDARY: 'SECONDARY',
} as const;

/** Estado genérico de una política de gobierno. */
export const POLICY_STATE = {
  ACTIVE: 'ACTIVE',
  RETIRED: 'RETIRED',
} as const;

/** Estado del vínculo de un tenant con su colocación. */
export const BINDING_STATE = {
  ACTIVE: 'ACTIVE',
  RETIRED: 'RETIRED',
} as const;

/** Estado de una región del backend. */
export const REGION_STATE = {
  ACTIVE: 'ACTIVE',
  RETIRED: 'RETIRED',
} as const;

/** Desenlace de una comprobación de salud (`store_health_checks.status`). */
export const HEALTH_STATUS = {
  HEALTHY: 'HEALTHY',
  DEGRADED: 'DEGRADED',
  UNHEALTHY: 'UNHEALTHY',
} as const;

/**
 * Define el tipo de dominio health status.
 */
export type HealthStatus = (typeof HEALTH_STATUS)[keyof typeof HEALTH_STATUS];

/** Cómo reacciona la política de replicación ante una región caída. */
export const FAILOVER_MODE = {
  AUTOMATIC: 'AUTOMATIC',
  MANUAL: 'MANUAL',
} as const;

/** Versión inicial que se asigna al dataset recién definido. */
export const INITIAL_DATASET_VERSION = '1.0.0';
