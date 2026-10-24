/** Fuente de datos que escanea el catálogo. Hoy hay una: la base primaria de la API. */
export const SOURCE_CODE = 'primary';

/** Versión del conector de introspección; cambia cuando cambia lo que el escaneo observa. */
export const CONNECTOR_VERSION = 'pg-introspector/1';

/** Versión del modelo de cobertura: si cambian las reglas, cambia este número. */
export const COVERAGE_MODEL_VERSION = 'catalog-coverage/v1';

export const OBJECT_KINDS = [
  'TABLE',
  'PARTITIONED_TABLE',
  'VIEW',
  'MATERIALIZED_VIEW',
  'FOREIGN_TABLE',
] as const;
export type ObjectKind = (typeof OBJECT_KINDS)[number];

export const OBSERVATION_STATUSES = [
  'OBSERVED',
  'NOT_OBSERVED',
  'RETIRED',
] as const;
export type ObservationStatus = (typeof OBSERVATION_STATUSES)[number];

export const REVIEW_STATUSES = [
  'DRAFT',
  'NEEDS_REVIEW',
  'APPROVED',
  'REJECTED',
] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const SENSITIVITIES = [
  'UNKNOWN',
  'NONE',
  'INTERNAL',
  'PII',
  'PHI',
  'SECRET',
] as const;
export type Sensitivity = (typeof SENSITIVITIES)[number];

export const SCAN_STATUSES = [
  'QUEUED',
  'RUNNING',
  'SUCCEEDED',
  'FAILED',
  'CANCELLED',
] as const;
export type ScanStatus = (typeof SCAN_STATUSES)[number];

export const EVIDENCE_KINDS = [
  'SCHEMA_COMMENT',
  'VAULT_NOTE',
  'MIGRATION',
  'CODE_REFERENCE',
  'OPENAPI',
  'OWNER_STATEMENT',
  'DOCUMENT',
] as const;
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];

export const MISSING_FILTERS = [
  'purpose',
  'existenceRationale',
  'rowGrain',
  'businessOwner',
] as const;
export type MissingFilter = (typeof MISSING_FILTERS)[number];

/** Campos de la ficha que se contestan con texto libre. */
export const TEXT_FIELDS = [
  'businessName',
  'definition',
  'purpose',
  'existenceRationale',
  'rowGrain',
  'alternativesRationale',
  'processSupported',
  'sourceOfTruth',
  'deletionImpact',
  'businessOwner',
  'dataSteward',
  'technicalOwner',
  'unit',
  'valueDomain',
  'nullSemantics',
] as const;
export type TextField = (typeof TEXT_FIELDS)[number];

/** Lo que una ficha debe responder, o declarar como pregunta abierta, para enviarse a revisión. */
export const REQUIRED_SEMANTIC_FIELDS = [
  'purpose',
  'existenceRationale',
  'rowGrain',
] as const;

/** Largo mínimo de una respuesta semántica: menos que esto no explica nada. */
export const MIN_SEMANTIC_LENGTH = 30;

/** Largo mínimo del motivo con que se rechaza una ficha. */
export const MIN_REJECTION_LENGTH = 10;

/**
 * Texto de relleno: repite que una tabla «guarda datos», que es lo único que ya se sabe de
 * cualquier tabla. Una ficha con esa respuesta no puede enviarse a revisión.
 */
export const FILLER_PATTERN =
  /^(esta\s+tabla\s+)?(almacena|guarda|contiene|registra)\s+(los\s+|las\s+)?(datos|informaci[oó]n|registros)\b/i;

/** Tope de nodos y de profundidad del análisis de impacto. */
export const IMPACT_MAX_NODES = 100;
export const IMPACT_MAX_DEPTH = 5;
export const IMPACT_DEFAULT_DEPTH = 2;

/** Lo que el análisis de impacto no ve; viaja en cada respuesta para que nadie lo tome por completo. */
export const IMPACT_SCOPE =
  'Sólo claves foráneas observadas en la base. No incluye dependencias por código, vistas, jobs, reportes ni integraciones: la ausencia de aristas no prueba ausencia de dependencias.';

/** Un escaneo RUNNING cuyo lease venció se considera abandonado. */
export const SCAN_LEASE_SECONDS = 300;

/** Qué no puede decir un escaneo; se informa con cada corrida. */
export const SCAN_LIMITATIONS = [
  {
    code: 'STATS_ARE_ESTIMATES',
    detail:
      'Filas estimadas desde pg_class.reltuples y tamaño desde pg_total_relation_size; no es un conteo.',
  },
  {
    code: 'PARTITIONS_NOT_LISTED',
    detail:
      'Las particiones de una tabla particionada no se listan: se cataloga la tabla padre.',
  },
  {
    code: 'READ_ONLY_INTROSPECTION',
    detail:
      'La introspección usa una transacción READ ONLY sobre la conexión de la API.',
  },
] as const;
