/**
 * Vocabulario del catálogo de datos (módulo 67).
 *
 * Los estados viven como `varchar` en la base y como uniones literales aquí, no
 * como conceptos de terminología: son el contrato del propio portal y cambiar
 * uno exige cambiar el código que lo interpreta, así que no tiene sentido que
 * se puedan editar sin despliegue.
 */

/** Única fuente soportada hoy: la base relacional a la que está conectada la API. */
export const PRIMARY_SOURCE = 'primary';

/** Versión del conector de introspección; viaja en cada corrida como evidencia. */
export const CONNECTOR_VERSION = 'pg-introspector/1';

export const OBJECT_KINDS = [
  'TABLE',
  'PARTITIONED_TABLE',
  'VIEW',
  'MATERIALIZED_VIEW',
  'FOREIGN_TABLE',
] as const;
export type ObjectKind = (typeof OBJECT_KINDS)[number];

/**
 * Un objeto que deja de verse no se borra: pasa a NOT_OBSERVED y queda como
 * candidato. RETIRED exige una decisión explícita, nunca la toma un escaneo.
 */
export const OBSERVATION_STATUSES = [
  'OBSERVED',
  'NOT_OBSERVED',
  'RETIRED',
] as const;
export type ObservationStatus = (typeof OBSERVATION_STATUSES)[number];

export const SCAN_STATUSES = [
  'QUEUED',
  'RUNNING',
  'SUCCEEDED',
  'FAILED',
  'CANCELLED',
] as const;
export type ScanStatus = (typeof SCAN_STATUSES)[number];
export const SCAN_TERMINAL: readonly ScanStatus[] = [
  'SUCCEEDED',
  'FAILED',
  'CANCELLED',
];

export const CHANGE_KINDS = [
  'ADDED',
  'CHANGED',
  'NOT_OBSERVED',
  'REAPPEARED',
] as const;
export type ChangeKind = (typeof CHANGE_KINDS)[number];

export const TARGET_KINDS = ['OBJECT', 'COLUMN'] as const;
export type TargetKind = (typeof TARGET_KINDS)[number];

export const REVIEW_STATUSES = [
  'DRAFT',
  'NEEDS_REVIEW',
  'APPROVED',
  'REJECTED',
] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const REVIEW_DECISIONS = ['APPROVED', 'REJECTED'] as const;
export type ReviewDecision = (typeof REVIEW_DECISIONS)[number];

/** De dónde salió el contenido de una revisión. Un import o una IA nunca es MANUAL. */
export const ANNOTATION_ORIGINS = [
  'MANUAL',
  'IMPORTED_VAULT',
  'AI_SUGGESTED',
] as const;
export type AnnotationOrigin = (typeof ANNOTATION_ORIGINS)[number];

/** UNKNOWN no equivale a NONE: significa que nadie lo ha determinado todavía. */
export const SENSITIVITIES = [
  'UNKNOWN',
  'NONE',
  'INTERNAL',
  'PII',
  'PHI',
  'SECRET',
] as const;
export type Sensitivity = (typeof SENSITIVITIES)[number];

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

/** Campos editables de una ficha, comunes a tabla y columna. */
export const COMMON_FIELDS = [
  'businessName',
  'definition',
  'purpose',
  'existenceRationale',
  'processSupported',
  'sourceOfTruth',
  'producers',
  'consumers',
  'deletionImpact',
  'businessOwner',
  'dataSteward',
  'technicalOwner',
  'sensitivity',
  'openQuestions',
] as const;

/** Sólo tienen sentido en una tabla. */
export const OBJECT_ONLY_FIELDS = [
  'rowGrain',
  'alternativesRationale',
] as const;

/** Sólo tienen sentido en una columna. */
export const COLUMN_ONLY_FIELDS = [
  'unit',
  'valueDomain',
  'nullSemantics',
] as const;

export type AnnotationField =
  | (typeof COMMON_FIELDS)[number]
  | (typeof OBJECT_ONLY_FIELDS)[number]
  | (typeof COLUMN_ONLY_FIELDS)[number];

/**
 * Pregunta abierta: la forma honesta de dejar un campo sin responder. La deuda
 * queda visible con responsable, en vez de rellenarse con una historia.
 */
export interface OpenQuestion {
  field?: AnnotationField;
  question: string;
  owner?: string;
  dueDate?: string;
}

/** Contenido completo de una ficha: es lo que se congela en cada revisión. */
export interface AnnotationContent {
  businessName: string | null;
  definition: string | null;
  purpose: string | null;
  existenceRationale: string | null;
  rowGrain: string | null;
  alternativesRationale: string | null;
  processSupported: string | null;
  sourceOfTruth: string | null;
  producers: string[];
  consumers: string[];
  deletionImpact: string | null;
  businessOwner: string | null;
  dataSteward: string | null;
  technicalOwner: string | null;
  unit: string | null;
  valueDomain: string | null;
  nullSemantics: string | null;
  sensitivity: Sensitivity;
  openQuestions: OpenQuestion[];
}

export const EMPTY_CONTENT: Readonly<AnnotationContent> = Object.freeze({
  businessName: null,
  definition: null,
  purpose: null,
  existenceRationale: null,
  rowGrain: null,
  alternativesRationale: null,
  processSupported: null,
  sourceOfTruth: null,
  producers: [],
  consumers: [],
  deletionImpact: null,
  businessOwner: null,
  dataSteward: null,
  technicalOwner: null,
  unit: null,
  valueDomain: null,
  nullSemantics: null,
  sensitivity: 'UNKNOWN',
  openQuestions: [],
});
