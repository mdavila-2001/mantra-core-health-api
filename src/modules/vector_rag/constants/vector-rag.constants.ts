/**
 * Constantes del módulo 59 (`vector_rag`).
 *
 * Como `object_storage`, `polyglot_storage` y `time_series`, este esquema usa
 * `varchar` y no `*_concept_id`. Los valores van en minúsculas porque así los
 * escribe el caso de uso (`lifecycle_state=active`, `status=queued`,
 * `authorization_decision=deny_consent`), y la comparación contra la columna es
 * literal.
 */

// --- Ciclo de vida de la colección ---
export const COLLECTION_STATES = ['active', 'sealed', 'deprecated'] as const;
export type CollectionState = (typeof COLLECTION_STATES)[number];

// --- Vínculo del tenant ---
export const BINDING_STATES = ['active', 'frozen'] as const;
export type BindingState = (typeof BINDING_STATES)[number];

// --- Política de acceso RAG ---
export const POLICY_STATES = ['draft', 'published'] as const;
export type PolicyState = (typeof POLICY_STATES)[number];

// --- Jobs de embedding ---
export const JOB_TYPES = ['backfill', 'incremental', 're_embed'] as const;
export type JobType = (typeof JOB_TYPES)[number];

export const JOB_STATUSES = [
  'queued',
  'running',
  'completed',
  'failed',
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

/** Estados en los que un job todavía depende del modelo de la colección. */
export const ACTIVE_JOB_STATUSES = ['queued', 'running'] as const;

// --- Ciclo de vida de documentos, chunks y embeddings ---
export const DOCUMENT_STATES = ['active', 'purged'] as const;
export type DocumentState = (typeof DOCUMENT_STATES)[number];

export const EMBEDDING_STATES = ['active', 'superseded', 'retired'] as const;
export type EmbeddingState = (typeof EMBEDDING_STATES)[number];

// --- Sesión de retrieval ---
export const SESSION_STATUSES = [
  'open',
  'ranked',
  'completed',
  'flagged',
] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

/**
 * Decisión de autorización por candidato.
 *
 * Los tres motivos de denegación se distinguen a propósito: "no tienes
 * consentimiento", "la etiqueta de seguridad no te corresponde" y "el paciente no
 * es el de tu ámbito" son fallos distintos, y colapsarlos en un `deny` genérico
 * haría imposible saber por qué una respuesta salió incompleta.
 */
export const AUTHORIZATION_DECISIONS = [
  'allow',
  'deny_consent',
  'deny_label',
  'deny_scope',
] as const;
export type AuthorizationDecision = (typeof AUTHORIZATION_DECISIONS)[number];

// --- Feedback ---
export const FEEDBACK_TYPES = ['relevance', 'safety', 'accuracy'] as const;
export type FeedbackType = (typeof FEEDBACK_TYPES)[number];

// --- Borrado ---
export const DELETION_STATUSES = [
  'requested',
  'verifying',
  'verified',
] as const;
export type DeletionStatus = (typeof DELETION_STATUSES)[number];

export const DELETION_REASONS = [
  'source_document_deleted',
  'patient_erasure',
  'orphan_purge',
] as const;
export type DeletionReason = (typeof DELETION_REASONS)[number];

// --- Reconciliación ---
export const RECONCILIATION_STATUSES = [
  'running',
  'clean',
  'drift_detected',
] as const;
export type ReconciliationStatus = (typeof RECONCILIATION_STATUSES)[number];

// --- Métrica de distancia ---
/**
 * Métricas que soporta el índice HNSW de pgvector. El índice del proyecto se crea
 * con `vector_cosine_ops` (ver `src/orm/catalog/physical.catalog.ts`), así que una
 * colección con otra métrica no tendría índice y su búsqueda degeneraría en un
 * escaneo completo del corpus.
 */
export const DISTANCE_METRICS = ['cosine', 'l2', 'inner_product'] as const;
export type DistanceMetric = (typeof DISTANCE_METRICS)[number];

/** Tipos de principal que pueden abrir una sesión de retrieval. */
export const PRINCIPAL_TYPES = ['user', 'agent', 'service'] as const;
export type PrincipalType = (typeof PRINCIPAL_TYPES)[number];

/** Tope de candidatos que devuelve una búsqueda. */
export const MAX_CANDIDATES = 200;

/** Tope de citas por sesión. */
export const MAX_EVIDENCE = 50;

/** Tope de chunks por lote de embedding. */
export const MAX_CHUNKS_PER_BATCH = 500;
