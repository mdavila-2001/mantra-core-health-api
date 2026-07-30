/**
 * Constantes del módulo 63 (`lakehouse`).
 *
 * Como los demás esquemas analíticos del proyecto, éste usa `varchar` y no
 * `*_concept_id`. Los valores van en minúsculas porque así los escribe el caso de
 * uso (`state=active`, `zone_type in raw|standardized|curated|research`).
 *
 * **Excepción**: `health_deidentification_runs` pertenece a `health_data`, que sí
 * es concept-driven; su estado se escribe con `CONCEPTS.DEID_*`.
 */

/**
 * Zonas del lago, en el orden en que el dato las atraviesa. `raw` guarda lo que
 * llegó; `curated` sólo admite dato ya de-identificado; `research` es de donde
 * salen los releases.
 */
export const ZONE_TYPES = [
  'raw',
  'standardized',
  'curated',
  'research',
] as const;
/**
 * Define el tipo de dominio zone type.
 */
export type ZoneType = (typeof ZONE_TYPES)[number];

export const ZONE_STATES = ['active', 'retired'] as const;
/**
 * Define el tipo de dominio zone state.
 */
export type ZoneState = (typeof ZONE_STATES)[number];

export const CATALOG_STATES = ['active', 'retired'] as const;
/**
 * Define el tipo de dominio catalog state.
 */
export type CatalogState = (typeof CATALOG_STATES)[number];

// --- Productos de datos ---
export const PRODUCT_STATES = ['draft', 'published', 'deprecated'] as const;
/**
 * Define el tipo de dominio product state.
 */
export type ProductState = (typeof PRODUCT_STATES)[number];

export const PRODUCT_VERSION_STATES = ['active', 'superseded'] as const;
/**
 * Define el tipo de dominio product version state.
 */
export type ProductVersionState = (typeof PRODUCT_VERSION_STATES)[number];

// --- Datasets ---
/**
 * `quarantined` no es un estado terminal: es el dataset que falló una regla de
 * calidad bloqueante y deja de servirse hasta que alguien lo mire. Sin él, un
 * dataset con datos malos seguiría alimentando informes.
 */
export const DATASET_STATES = ['active', 'quarantined', 'retired'] as const;
/**
 * Define el tipo de dominio dataset state.
 */
export type DatasetState = (typeof DATASET_STATES)[number];

export const COMPATIBILITY_MODES = [
  'none',
  'backward',
  'forward',
  'full',
] as const;
/**
 * Define el tipo de dominio compatibility mode.
 */
export type CompatibilityMode = (typeof COMPATIBILITY_MODES)[number];

export const STORAGE_FORMATS = [
  'parquet',
  'delta',
  'iceberg',
  'avro',
  'orc',
] as const;
/**
 * Define el tipo de dominio storage format.
 */
export type StorageFormat = (typeof STORAGE_FORMATS)[number];

// --- Particiones y archivos ---
/**
 * Una partición `committed` es visible para las consultas. `pending` es la que se
 * está escribiendo, y `superseded` la que una corrección sustituyó — porque en un
 * lakehouse una corrección **no** reescribe: crea una partición nueva.
 */
export const PARTITION_STATES = ['pending', 'committed', 'superseded'] as const;
/**
 * Define el tipo de dominio partition state.
 */
export type PartitionState = (typeof PARTITION_STATES)[number];

// --- Transformaciones ---
export const DEFINITION_STATES = ['draft', 'active', 'retired'] as const;
/**
 * Define el tipo de dominio definition state.
 */
export type DefinitionState = (typeof DEFINITION_STATES)[number];

export const RUN_STATUSES = ['running', 'succeeded', 'failed'] as const;
/**
 * Define el tipo de dominio run status.
 */
export type RunStatus = (typeof RUN_STATUSES)[number];

/** Estados en los que una corrida sigue ocupando su dataset objetivo. */
export const LIVE_RUN_STATUSES = ['running'] as const;

// --- Calidad ---
export const QUALITY_RUN_STATUSES = ['running', 'passed', 'failed'] as const;
/**
 * Define el tipo de dominio quality run status.
 */
export type QualityRunStatus = (typeof QUALITY_RUN_STATUSES)[number];

export const QUALITY_ISSUE_STATUSES = [
  'open',
  'acknowledged',
  'resolved',
] as const;
/**
 * Define el tipo de dominio quality issue status.
 */
export type QualityIssueStatus = (typeof QUALITY_ISSUE_STATUSES)[number];

export const QUALITY_DIMENSIONS = [
  'completeness',
  'accuracy',
  'consistency',
  'timeliness',
  'uniqueness',
  'validity',
] as const;
/**
 * Define el tipo de dominio quality dimension.
 */
export type QualityDimension = (typeof QUALITY_DIMENSIONS)[number];

/**
 * Severidad de la regla. `blocking` es la única que cuarentena el dataset: es la
 * diferencia entre "esto está mal y hay que mirarlo" y "esto está tan mal que no
 * se puede servir".
 */
export const RULE_SEVERITIES = ['info', 'warning', 'blocking'] as const;
/**
 * Define el tipo de dominio rule severity.
 */
export type RuleSeverity = (typeof RULE_SEVERITIES)[number];

export const RULE_STATES = ['active', 'retired'] as const;
/**
 * Define el tipo de dominio rule state.
 */
export type RuleState = (typeof RULE_STATES)[number];

// --- Investigación ---
export const PROJECT_STATES = ['draft', 'approved', 'closed'] as const;
/**
 * Define el tipo de dominio project state.
 */
export type ProjectState = (typeof PROJECT_STATES)[number];

export const COHORT_STATES = ['active', 'retired'] as const;
/**
 * Define el tipo de dominio cohort state.
 */
export type CohortState = (typeof COHORT_STATES)[number];

/**
 * Ciclo de vida de la solicitud de release. `released` significa que el
 * manifiesto está materializado y el investigador tiene acceso temporal;
 * `expired` y `revoked` se distinguen porque una es el fin del plazo y la otra
 * una decisión de gobernanza, y auditarlas juntas escondería la segunda.
 */
export const RELEASE_STATUSES = [
  'submitted',
  'approved',
  'released',
  'expired',
  'revoked',
  'rejected',
] as const;
/**
 * Define el tipo de dominio release status.
 */
export type ReleaseStatus = (typeof RELEASE_STATUSES)[number];

/** Estados desde los que todavía se puede aprobar la solicitud. */
export const APPROVABLE_RELEASE_STATUSES = ['submitted'] as const;

/** Estados que se pueden cerrar por expiración o revocación. */
export const CLOSEABLE_RELEASE_STATUSES = ['released'] as const;

/** Vida por defecto del acceso concedido con un release, en días. */
export const DEFAULT_RELEASE_TTL_DAYS = 90;

/** Tope de particiones y archivos por corrida. */
export const MAX_PARTITIONS_PER_RUN = 500;
export const MAX_FILES_PER_PARTITION = 1000;

/** Tope de reglas por versión de producto. */
export const MAX_QUALITY_RULES = 200;
