import { createHash } from 'node:crypto';
import {
  FILLER_PATTERN,
  MIN_REJECTION_LENGTH,
  MIN_SEMANTIC_LENGTH,
  REQUIRED_SEMANTIC_FIELDS,
  TEXT_FIELDS,
  type Sensitivity,
} from './catalog.constants';

export interface OpenQuestion {
  field?: string;
  question: string;
  owner?: string;
  dueDate?: string;
}

/** Contenido completo de una ficha. `null` = nadie lo respondió todavía. */
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

export const EMPTY_CONTENT: AnnotationContent = {
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
};

/** Edición parcial: lo que no viene se conserva; `null` borra. */
export type ContentPatch = Partial<AnnotationContent>;

export function applyPatch(
  current: AnnotationContent,
  patch: ContentPatch,
): AnnotationContent {
  const next: AnnotationContent = { ...current };
  for (const campo of TEXT_FIELDS)
    if (campo in patch) next[campo] = normalizeText(patch[campo] ?? null);
  if (patch.consumers !== undefined) next.consumers = patch.consumers ?? [];
  if (patch.producers !== undefined) next.producers = patch.producers ?? [];
  if (patch.openQuestions !== undefined)
    next.openQuestions = patch.openQuestions ?? [];
  if (patch.sensitivity !== undefined) next.sensitivity = patch.sensitivity;
  return next;
}

/** Texto vacío o sólo espacios equivale a «sin respuesta»: se guarda `null`. */
export function normalizeText(texto: string | null | undefined): string | null {
  if (typeof texto !== 'string') return null;
  const limpio = texto.trim();
  return limpio.length ? limpio : null;
}

export interface Violation {
  field: string;
  reason: 'REQUIRED_OR_OPEN_QUESTION' | 'FILLER_TEXT' | 'TOO_SHORT';
  message: string;
}

/**
 * Qué le falta a una ficha para enviarse a revisión: propósito, razón de existir y grano de fila
 * contestados con algo que explique, o declarados como pregunta abierta con su campo.
 */
export function submissionViolations(content: AnnotationContent): Violation[] {
  const declaradas = new Set(content.openQuestions.map((q) => q.field));
  const violaciones: Violation[] = [];
  for (const campo of REQUIRED_SEMANTIC_FIELDS) {
    const valor = content[campo];
    if (!valor) {
      if (!declaradas.has(campo))
        violaciones.push({
          field: campo,
          reason: 'REQUIRED_OR_OPEN_QUESTION',
          message: `«${campo}» debe responderse o registrarse como pregunta abierta`,
        });
    } else if (FILLER_PATTERN.test(valor))
      violaciones.push({
        field: campo,
        reason: 'FILLER_TEXT',
        message: `«${campo}» repite que la tabla guarda datos: eso ya se sabe de cualquier tabla`,
      });
    else if (valor.length < MIN_SEMANTIC_LENGTH)
      violaciones.push({
        field: campo,
        reason: 'TOO_SHORT',
        message: `«${campo}» tiene que explicar en al menos ${MIN_SEMANTIC_LENGTH} caracteres`,
      });
  }
  return violaciones;
}

/** Huella del contenido de una revisión: dos revisiones con el mismo contenido tienen la misma huella. */
export function contentHash(content: AnnotationContent): string {
  const ordenado = JSON.stringify(content, Object.keys(content).sort());
  return createHash('sha256').update(ordenado).digest('hex');
}

export interface ReviewState {
  reviewStatus: string;
  currentRevisionNo: number;
  /** Quien escribió la revisión vigente. */
  revisionAuthorId: string | null;
  evidenceCount: number;
}

export type ReviewVerdict =
  | { ok: true }
  | {
      ok: false;
      kind:
        | 'STALE_REVISION'
        | 'NOT_IN_REVIEW'
        | 'SELF_REVIEW'
        | 'REJECTION_NEEDS_REASON'
        | 'APPROVAL_NEEDS_EVIDENCE';
      message: string;
    };

/**
 * Reglas de una decisión de revisión, en el orden en que se explican a quien decide: la ficha
 * cambió desde que se leyó, no está en revisión, quien la escribió no la decide, un rechazo
 * explica qué falta y una aprobación tiene evidencia.
 */
export function reviewVerdict(
  state: ReviewState,
  input: {
    decision: 'APPROVED' | 'REJECTED';
    expectedRevisionNo: number;
    comment?: string | null;
  },
  reviewerId: string,
): ReviewVerdict {
  if (input.expectedRevisionNo !== state.currentRevisionNo)
    return {
      ok: false,
      kind: 'STALE_REVISION',
      message: 'La ficha tiene una revisión más reciente que la revisada',
    };
  if (state.reviewStatus !== 'NEEDS_REVIEW')
    return {
      ok: false,
      kind: 'NOT_IN_REVIEW',
      message: 'Sólo se revisa una ficha en revisión',
    };
  if (state.revisionAuthorId !== null && state.revisionAuthorId === reviewerId)
    return {
      ok: false,
      kind: 'SELF_REVIEW',
      message: 'Quien escribió la revisión no puede decidir sobre ella',
    };
  if (
    input.decision === 'REJECTED' &&
    (input.comment ?? '').trim().length < MIN_REJECTION_LENGTH
  )
    return {
      ok: false,
      kind: 'REJECTION_NEEDS_REASON',
      message: 'Un rechazo debe explicar qué falta o qué está mal',
    };
  if (input.decision === 'APPROVED' && state.evidenceCount === 0)
    return {
      ok: false,
      kind: 'APPROVAL_NEEDS_EVIDENCE',
      message: 'No se aprueba una ficha sin al menos una evidencia enlazada',
    };
  return { ok: true };
}
