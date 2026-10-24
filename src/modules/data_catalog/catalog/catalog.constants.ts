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
  /** Lo que la clasificación automática detectó y nadie curó. Nunca lo pone una persona. */
  'AUTO_DETECTED',
  /** Borrador que una persona guardó sin enviar a revisión. */
  'DRAFT',
  'NEEDS_REVIEW',
  'APPROVED',
  'REJECTED',
] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

/** Estado de revisión de las fichas que sólo crea la clasificación automática. */
export const AUTO_DETECTED_STATUS = 'AUTO_DETECTED' satisfies ReviewStatus;

/**
 * Quién escribió una ficha o una revisión. `MANUAL` es una persona (incluye el importador de la
 * bóveda, que actúa con credenciales de una persona); `AUTO_CLASSIFIER` es la clasificación
 * automática, que nunca pisa lo `MANUAL`.
 */
export const ANNOTATION_ORIGINS = ['MANUAL', 'AUTO_CLASSIFIER'] as const;
export type AnnotationOrigin = (typeof ANNOTATION_ORIGINS)[number];

/**
 * Nivel de sensibilidad de un dato (HIPAA 45 CFR 160.103 y 164.514(b)(2); LGPD arts. 5, 11, 12, 13).
 * `UNKNOWN` significa «sin clasificar» y no es un nivel. Son los `code` de
 * `system_ops.data_classifications`; el enlace es por código, sin DDL.
 *
 * El orden importa: va de menos a más sensible. `SENSITIVITY_RANK` lo usa para decidir que la
 * clasificación automática nunca baja un nivel.
 */
export const SENSITIVITIES = [
  'UNKNOWN',
  'ANONYMIZED',
  'PUBLIC',
  'INTERNAL',
  'PSEUDONYMIZED',
  'PERSONAL',
  'PHI_IDENTIFIER',
  'PHI_SENSITIVE',
  'PHI_SPECIAL',
  'CREDENTIAL',
] as const;
export type Sensitivity = (typeof SENSITIVITIES)[number];

/** Posición de cada nivel en la escala de sensibilidad; `UNKNOWN` queda debajo de todo. */
export const SENSITIVITY_RANK: Readonly<Record<Sensitivity, number>> =
  Object.fromEntries(SENSITIVITIES.map((nivel, i) => [nivel, i])) as Record<
    Sensitivity,
    number
  >;

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

/** Lo que la ficha de una columna debe responder para enviarse a revisión. */
export const COLUMN_REQUIRED_SEMANTIC_FIELDS = ['definition'] as const;

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

/**
 * Cada cuánto pide un escaneo la sonda (el worker `scan-tick` golpea cada pocos segundos; sólo
 * escanea si pasó este intervalo desde que terminó el último). 15 min: propuesta a confirmar.
 */
export const PROBE_INTERVAL_MS = 15 * 60 * 1000;

/** Código de error de un escaneo que falló al observar o aplicar. */
export const SCAN_FAILED_CODE = 'SCAN_FAILED';

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
