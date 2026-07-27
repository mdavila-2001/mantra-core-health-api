/**
 * Constantes del módulo 61 (`graph_intelligence`).
 *
 * Como los demás esquemas políglotas del proyecto, éste usa `varchar` y no
 * `*_concept_id`. Los valores van en minúsculas porque así los escribe el caso de
 * uso (`lifecycle_state='active'`, `status='open'`).
 */

// --- Ciclo de vida de nodos y aristas ---
export const NODE_STATES = ['active', 'deleted'] as const;
export type NodeState = (typeof NODE_STATES)[number];

/**
 * Una arista `expired` cerró su relación de forma natural (el referido terminó);
 * una `retired` se retiró porque la proyección dejó de considerarla válida. Las
 * dos salen del traversal, pero la distinción es lo que permite explicar por qué.
 */
export const EDGE_STATES = ['active', 'expired', 'retired', 'deleted'] as const;
export type EdgeState = (typeof EDGE_STATES)[number];

// --- Definiciones y alcances ---
export const DEFINITION_STATES = ['draft', 'active', 'suspended'] as const;
export type DefinitionState = (typeof DEFINITION_STATES)[number];

export const SCOPE_STATES = ['active', 'suspended'] as const;
export type ScopeState = (typeof SCOPE_STATES)[number];

// --- Corridas de proyección ---
export const RUN_STATUSES = ['running', 'completed', 'failed'] as const;
export type RunStatus = (typeof RUN_STATUSES)[number];

// --- Hallazgos de regla ---
export const HIT_STATUSES = [
  'open',
  'in_review',
  'resolved',
  'dismissed',
] as const;
export type HitStatus = (typeof HIT_STATUSES)[number];

/**
 * Transiciones admitidas del hallazgo. Un hallazgo cerrado no se reabre: si
 * vuelve a darse el patrón, la regla genera uno nuevo, y así el histórico
 * conserva cuántas veces ocurrió.
 */
export const HIT_TRANSITIONS: Record<string, readonly string[]> = {
  open: ['in_review', 'resolved', 'dismissed'],
  in_review: ['resolved', 'dismissed'],
  resolved: [],
  dismissed: [],
};

/** Estados en los que el hallazgo sigue vivo y bloquea uno nuevo del mismo patrón. */
export const LIVE_HIT_STATUSES = ['open', 'in_review'] as const;

// --- Borrado ---
export const DELETION_STATUSES = ['requested', 'running', 'verified'] as const;
export type DeletionStatus = (typeof DELETION_STATUSES)[number];

/** Estados en los que un job de borrado ya está en marcha y no se duplica. */
export const ACTIVE_DELETION_STATUSES = ['requested', 'running'] as const;

// --- Direccionalidad de la arista ---
export const DIRECTIONALITIES = ['directed', 'undirected'] as const;
export type Directionality = (typeof DIRECTIONALITIES)[number];

// --- Tipos de evidencia ---
export const EVIDENCE_TYPES = [
  'source_event',
  'manual_assertion',
  'inference',
  'termination',
] as const;
export type EvidenceType = (typeof EVIDENCE_TYPES)[number];

// --- Severidad de la regla ---
export const SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;
export type Severity = (typeof SEVERITIES)[number];

/**
 * Confianza acotada a `[0,1]`, como declara el caso de uso: la suma de los deltas
 * de evidencia se recorta a ese rango. Una confianza fuera de él no significaría
 * nada para las reglas que la comparan contra un umbral.
 */
export const MIN_CONFIDENCE = 0;
export const MAX_CONFIDENCE = 1;

/** Confianza con la que nace una arista antes de acumular evidencia. */
export const BASE_CONFIDENCE = 0.5;

/**
 * Tope duro de profundidad, por encima de lo que pida cualquier alcance. Un
 * traversal sin tope sobre un grafo de referidos recorre media red en cuanto hay
 * un nodo muy conectado.
 */
export const MAX_HOPS_CEILING = 6;

/** Tope de nodos que devuelve un traversal. */
export const MAX_TRAVERSAL_NODES = 500;

/** Vida de una entrada de la caché de rutas. */
export const PATH_CACHE_TTL_SECONDS = 900;

/** Vida de un puntaje de riesgo antes de forzar su recálculo. */
export const RISK_SCORE_TTL_SECONDS = 86_400;

/** Tope de nodos por lote de proyección. */
export const MAX_PROJECTION_BATCH = 1000;
