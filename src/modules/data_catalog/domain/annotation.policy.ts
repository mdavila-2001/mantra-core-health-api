import { createHash } from 'node:crypto';
import {
  COLUMN_ONLY_FIELDS,
  EMPTY_CONTENT,
  OBJECT_ONLY_FIELDS,
  type AnnotationContent,
  type AnnotationField,
  type ReviewDecision,
  type ReviewStatus,
  type TargetKind,
} from './catalog.model';

/**
 * Reglas de la ficha de justificación. Funciones puras: no saben de ORM ni de
 * HTTP, devuelven violaciones y el servicio decide cómo traducirlas.
 */

export interface PolicyViolation {
  field?: AnnotationField | 'comment' | 'evidence' | 'reviewer' | 'status';
  reason: string;
  message: string;
}

/** Un parche puede traer cualquier subconjunto; `null` borra el valor. */
export type AnnotationPatch = Partial<AnnotationContent>;

/**
 * Campos que una ficha de tabla debe responder —o declarar como pregunta
 * abierta— para poder enviarse a revisión.
 */
export const OBJECT_REQUIRED_ON_SUBMIT: readonly AnnotationField[] = [
  'purpose',
  'existenceRationale',
  'rowGrain',
];
export const COLUMN_REQUIRED_ON_SUBMIT: readonly AnnotationField[] = [
  'definition',
];

/** Campos de texto libre sobre los que se aplica el detector de relleno. */
const NARRATIVE_FIELDS: readonly AnnotationField[] = [
  'definition',
  'purpose',
  'existenceRationale',
  'rowGrain',
  'deletionImpact',
  'alternativesRationale',
];

/** Por debajo de esto no cabe una justificación, sólo una etiqueta. */
export const MIN_NARRATIVE_LENGTH = 30;
export const MIN_REJECTION_COMMENT_LENGTH = 10;

/**
 * Frases que describen *qué guarda* la tabla en lugar de *por qué existe*.
 * "Almacena los datos de pacientes" es verdad para casi cualquier tabla con
 * esa palabra en el nombre, y por eso no justifica ninguna.
 */
const FILLER_PATTERNS: readonly RegExp[] = [
  /^(esta\s+tabla\s+)?(almacena|guarda|contiene|registra|mantiene)\s+(los\s+|las\s+|el\s+|la\s+)?(datos|informaci[oó]n|registros|info)\b/i,
  /^tabla\s+(de|para|que)\b/i,
  /^(this\s+table\s+)?(stores?|holds?|contains?|keeps?)\s+(the\s+)?(data|information|records)\b/i,
  /^(n\/?a|tbd|todo|pendiente|por\s+definir|sin\s+descripci[oó]n|-+|\.+)$/i,
  // Plantilla generada de la bóveda: vale como evidencia importada, no como ficha.
  /si esta tabla se eliminara, el negocio perder[ií]a el registro mismo/i,
];

/** Aplica el parche sobre el contenido vigente sin mutarlo. */
export function mergeContent(
  current: AnnotationContent | null,
  patch: AnnotationPatch,
): AnnotationContent {
  const base = current ?? EMPTY_CONTENT;
  const next: AnnotationContent = { ...base };
  for (const [key, value] of Object.entries(patch) as [
    keyof AnnotationContent,
    unknown,
  ][]) {
    if (value === undefined) continue;
    (next as unknown as Record<string, unknown>)[key] =
      typeof value === 'string' ? normalizeText(value) : value;
  }
  next.producers = uniqueTrimmed(next.producers);
  next.consumers = uniqueTrimmed(next.consumers);
  return next;
}

/** Recorta espacios; una cadena vacía es un valor ausente, no un valor. */
function normalizeText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function uniqueTrimmed(values: readonly string[] | null | undefined): string[] {
  const seen = new Set<string>();
  for (const value of values ?? []) {
    const trimmed = value.trim();
    if (trimmed) seen.add(trimmed);
  }
  return [...seen];
}

/** Campos del parche que no corresponden al tipo de objeto anotado. */
export function misplacedFields(
  targetKind: TargetKind,
  patch: AnnotationPatch,
): PolicyViolation[] {
  const forbidden: readonly string[] =
    targetKind === 'OBJECT' ? COLUMN_ONLY_FIELDS : OBJECT_ONLY_FIELDS;
  return Object.keys(patch)
    .filter(
      (key) =>
        forbidden.includes(key) &&
        patch[key as keyof AnnotationContent] !== undefined,
    )
    .map((key) => ({
      field: key as AnnotationField,
      reason: 'FIELD_NOT_APPLICABLE',
      message:
        targetKind === 'OBJECT'
          ? `"${key}" describe una columna, no una tabla`
          : `"${key}" describe una tabla, no una columna`,
    }));
}

/**
 * ¿El texto es relleno? Devuelve el motivo o `null` si pasa. Es un filtro
 * grueso y complementario a la revisión humana: deja pasar texto malo que no
 * calce con un patrón, pero no deja pasar lo que obviamente no dice nada.
 */
export function fillerReason(
  text: string,
  technicalName: string,
): string | null {
  const normalized = text.trim();
  if (normalized.length < MIN_NARRATIVE_LENGTH) return 'TOO_SHORT';
  const bare = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (bare(normalized) === bare(technicalName)) return 'REPEATS_TECHNICAL_NAME';
  if (FILLER_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return 'GENERIC_PHRASE';
  }
  return null;
}

/**
 * Violaciones que impiden enviar la ficha a revisión. Un borrador puede estar
 * incompleto; una ficha enviada debe responder cada campo obligatorio o
 * declarar por qué no puede (pregunta abierta sobre ese campo).
 */
export function submissionViolations(
  targetKind: TargetKind,
  content: AnnotationContent,
  technicalName: string,
): PolicyViolation[] {
  const violations: PolicyViolation[] = [];
  const required =
    targetKind === 'OBJECT'
      ? OBJECT_REQUIRED_ON_SUBMIT
      : COLUMN_REQUIRED_ON_SUBMIT;
  const declaredUnknown = new Set(
    content.openQuestions
      .map((question) => question.field)
      .filter((field): field is AnnotationField => Boolean(field)),
  );

  for (const field of required) {
    const value = content[field];
    if ((value === null || value === '') && !declaredUnknown.has(field)) {
      violations.push({
        field,
        reason: 'REQUIRED_OR_OPEN_QUESTION',
        message: `"${field}" debe responderse o registrarse como pregunta abierta`,
      });
    }
  }

  for (const field of NARRATIVE_FIELDS) {
    const value = content[field];
    if (typeof value !== 'string') continue;
    const reason = fillerReason(value, technicalName);
    if (reason) {
      violations.push({
        field,
        reason: `FILLER_TEXT:${reason}`,
        message: `"${field}" no explica nada que el nombre técnico no diga ya`,
      });
    }
  }

  for (const question of content.openQuestions) {
    if (!question.question || question.question.trim().length < 10) {
      violations.push({
        field: 'openQuestions',
        reason: 'OPEN_QUESTION_TOO_VAGUE',
        message: 'Cada pregunta abierta debe formularse de forma concreta',
      });
      break;
    }
  }
  return violations;
}

export interface ReviewContext {
  status: ReviewStatus;
  currentRevisionNo: number;
  expectedRevisionNo: number;
  revisionAuthorId: string | null;
  reviewerId: string;
  decision: ReviewDecision;
  comment: string | null | undefined;
  evidenceCount: number;
}

/**
 * Precondiciones de una decisión de revisión. La comparación de revisión se
 * deja al servicio (es un conflicto de concurrencia, no una regla de negocio).
 *
 * La segregación se comprueba por identidad y no por rol: un SUPERADMIN que
 * escribió la revisión tampoco puede aprobarla.
 */
export function reviewViolations(ctx: ReviewContext): PolicyViolation[] {
  const violations: PolicyViolation[] = [];
  if (ctx.status !== 'NEEDS_REVIEW') {
    violations.push({
      field: 'status',
      reason: 'NOT_PENDING_REVIEW',
      message: `Sólo se revisa una ficha en NEEDS_REVIEW (está en ${ctx.status})`,
    });
  }
  if (ctx.revisionAuthorId && ctx.revisionAuthorId === ctx.reviewerId) {
    violations.push({
      field: 'reviewer',
      reason: 'SELF_REVIEW',
      message: 'Quien escribió la revisión no puede decidir sobre ella',
    });
  }
  const comment = ctx.comment?.trim() ?? '';
  if (
    ctx.decision === 'REJECTED' &&
    comment.length < MIN_REJECTION_COMMENT_LENGTH
  ) {
    violations.push({
      field: 'comment',
      reason: 'REJECTION_NEEDS_COMMENT',
      message: 'Un rechazo debe explicar qué falta o qué está mal',
    });
  }
  if (ctx.decision === 'APPROVED' && ctx.evidenceCount === 0) {
    violations.push({
      field: 'evidence',
      reason: 'APPROVAL_NEEDS_EVIDENCE',
      message: 'No se aprueba una ficha sin al menos una evidencia enlazada',
    });
  }
  return violations;
}

/**
 * Hash canónico del contenido: claves ordenadas, para que dos parches que
 * llegan al mismo resultado no generen dos revisiones.
 */
export function contentHash(content: AnnotationContent): string {
  return createHash('sha256').update(canonicalJson(content)).digest('hex');
}

export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value ?? null);
}
