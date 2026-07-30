/**
 * Constantes del módulo 62 (`cross_store_consistency`).
 *
 * Este esquema usa `varchar` y **MAYÚSCULAS**, como `polyglot_storage`: el caso de
 * uso escribe `state=ACTIVE`, `status=IN_PROGRESS -> SUCCEEDED`,
 * `result=MATCH|DIVERGENT|MISSING`. La comparación contra la columna es literal,
 * así que la caja importa — mezclarla sería un fallo silencioso que sólo
 * aparecería en producción.
 */

// --- Definiciones y suscripciones de proyección ---
export const DEFINITION_STATES = ['ACTIVE', 'PAUSED', 'RETIRED'] as const;
/**
 * Define el tipo de dominio definition state.
 */
export type DefinitionState = (typeof DEFINITION_STATES)[number];

export const SUBSCRIPTION_STATES = ['ACTIVE', 'PAUSED', 'RETIRED'] as const;
/**
 * Define el tipo de dominio subscription state.
 */
export type SubscriptionState = (typeof SUBSCRIPTION_STATES)[number];

/**
 * Semántica de entrega. `AT_LEAST_ONCE` es la única realista sobre un outbox: el
 * consumidor tiene que ser idempotente, y por eso cada intento lleva su clave.
 */
export const DELIVERY_SEMANTICS = [
  'AT_LEAST_ONCE',
  'AT_MOST_ONCE',
  'EXACTLY_ONCE',
] as const;
/**
 * Define el tipo de dominio delivery semantics.
 */
export type DeliverySemantics = (typeof DELIVERY_SEMANTICS)[number];

// --- Intentos de entrega ---
export const ATTEMPT_STATUSES = ['IN_PROGRESS', 'SUCCEEDED', 'FAILED'] as const;
/**
 * Define el tipo de dominio attempt status.
 */
export type AttemptStatus = (typeof ATTEMPT_STATUSES)[number];

export const DEAD_LETTER_STATES = ['OPEN', 'REPLAYED', 'DISCARDED'] as const;
/**
 * Define el tipo de dominio dead letter state.
 */
export type DeadLetterState = (typeof DEAD_LETTER_STATES)[number];

// --- Consumidores ---
export const CONSUMER_STATES = ['ACTIVE', 'DRAINING', 'STOPPED'] as const;
/**
 * Define el tipo de dominio consumer state.
 */
export type ConsumerState = (typeof CONSUMER_STATES)[number];

// --- Reconciliación ---
export const RECONCILIATION_STATUSES = [
  'RUNNING',
  'COMPLETED',
  'FAILED',
] as const;
/**
 * Define el tipo de dominio reconciliation status.
 */
export type ReconciliationStatus = (typeof RECONCILIATION_STATUSES)[number];

/**
 * Resultado de comparar una entidad canónica con su proyección.
 *
 * - `MATCH`: los dos hashes coinciden.
 * - `DIVERGENT`: está en los dos sitios pero con contenido distinto.
 * - `MISSING`: el canónico la tiene y la proyección no.
 * - `EXTRA`: la proyección la tiene y el canónico ya no — un huérfano.
 */
export const ITEM_RESULTS = ['MATCH', 'DIVERGENT', 'MISSING', 'EXTRA'] as const;
/**
 * Define el tipo de dominio item result.
 */
export type ItemResult = (typeof ITEM_RESULTS)[number];

/** Resultados que abren un evento de deriva; `MATCH` no. */
export const DRIFT_RESULTS = ['DIVERGENT', 'MISSING', 'EXTRA'] as const;

export const DRIFT_STATUSES = ['OPEN', 'RESOLVED', 'DISMISSED'] as const;
/**
 * Define el tipo de dominio drift status.
 */
export type DriftStatus = (typeof DRIFT_STATUSES)[number];

export const SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
/**
 * Define el tipo de dominio severity.
 */
export type Severity = (typeof SEVERITIES)[number];

/**
 * Severidad que corresponde a cada clase de deriva. Un huérfano en un store
 * secundario es dato que ya no debería existir en ningún sitio —puede ser un
 * borrado que no se propagó—, y por eso pesa más que una versión desfasada.
 */
export const DRIFT_SEVERITY: Record<string, Severity> = {
  DIVERGENT: 'MEDIUM',
  MISSING: 'HIGH',
  EXTRA: 'CRITICAL',
};

// --- Reparación ---
export const REPAIR_ACTIONS = [
  'REPROJECT',
  'REINDEX',
  'DELETE_ORPHAN',
] as const;
/**
 * Define el tipo de dominio repair action.
 */
export type RepairAction = (typeof REPAIR_ACTIONS)[number];

export const JOB_STATUSES = [
  'REQUESTED',
  'RUNNING',
  'COMPLETED',
  'FAILED',
] as const;
/**
 * Define el tipo de dominio job status.
 */
export type JobStatus = (typeof JOB_STATUSES)[number];

// --- Borrado ---
export const DELETION_REQUEST_STATES = [
  'PENDING',
  'EXPANDED',
  'COMPLETED',
  'BLOCKED',
  'CANCELLED',
] as const;
/**
 * Define el tipo de dominio deletion request state.
 */
export type DeletionRequestState = (typeof DELETION_REQUEST_STATES)[number];

export const DELETION_TARGET_STATES = [
  'PENDING',
  'EXECUTED',
  'VERIFIED',
  'BLOCKED',
] as const;
/**
 * Define el tipo de dominio deletion target state.
 */
export type DeletionTargetState = (typeof DELETION_TARGET_STATES)[number];

/**
 * Modo de borrado por store. `CRYPTO_SHRED` es para los que no admiten borrado
 * físico: se destruye la clave y el dato queda ilegible. `ANONYMIZE` es para los
 * que tienen que conservar la fila por integridad referencial.
 */
export const DELETION_MODES = ['HARD', 'CRYPTO_SHRED', 'ANONYMIZE'] as const;
/**
 * Define el tipo de dominio deletion mode.
 */
export type DeletionMode = (typeof DELETION_MODES)[number];

export const EXECUTION_STATUSES = [
  'IN_PROGRESS',
  'SUCCEEDED',
  'FAILED',
] as const;
/**
 * Define el tipo de dominio execution status.
 */
export type ExecutionStatus = (typeof EXECUTION_STATUSES)[number];

export const VERIFICATION_METHODS = [
  'QUERY_ABSENCE',
  'CHECKSUM',
  'PROVIDER_RECEIPT',
] as const;
/**
 * Define el tipo de dominio verification method.
 */
export type VerificationMethod = (typeof VERIFICATION_METHODS)[number];

// --- Mantenimiento ---
export const MOVEMENT_MODES = ['COPY', 'MOVE'] as const;
/**
 * Define el tipo de dominio movement mode.
 */
export type MovementMode = (typeof MOVEMENT_MODES)[number];

export const MIGRATION_STRATEGIES = [
  'IN_PLACE',
  'DUAL_WRITE',
  'BACKFILL',
] as const;
/**
 * Define el tipo de dominio migration strategy.
 */
export type MigrationStrategy = (typeof MIGRATION_STRATEGIES)[number];

export const CACHE_JOB_STATUSES = ['PENDING', 'COMPLETED', 'FAILED'] as const;
/**
 * Define el tipo de dominio cache job status.
 */
export type CacheJobStatus = (typeof CACHE_JOB_STATUSES)[number];

/** Ámbitos de caché que se pueden invalidar. */
export const CACHE_SCOPES = ['ENTITY', 'DATASET', 'TENANT', 'SESSION'] as const;
/**
 * Define el tipo de dominio cache scope.
 */
export type CacheScope = (typeof CACHE_SCOPES)[number];

/** Plazo por defecto para cumplir una solicitud de borrado, en días. */
export const DEFAULT_DELETION_SLA_DAYS = 30;

/** Tope de objetivos por solicitud de borrado. */
export const MAX_DELETION_TARGETS = 200;

/** Tope de entidades comparadas por corrida de reconciliación. */
export const MAX_RECONCILIATION_ITEMS = 5000;

/** Tope de intentos de entrega antes de mandar a dead-letter. */
export const DEFAULT_MAX_ATTEMPTS = 5;

/**
 * Lote por defecto de las consultas de descubrimiento del worker de borrado
 * (Fase 4 del plan de corrección de workers): cuántos objetivos `PENDING`/
 * `EXECUTED` trae cada tick cuando la petición no fija `limit`.
 */
export const DEFAULT_DELETION_DISCOVERY_BATCH = 20;
