import {
  AUTO_DETECTED_STATUS,
  SENSITIVITY_RANK,
  type AnnotationOrigin,
  type ReviewStatus,
  type Sensitivity,
} from '../catalog/catalog.constants';
import {
  ALL_MODIFIER_TOKENS,
  CERTAINTY_THRESHOLD,
  CLASSIFICATION_RULES,
  CONFIDENCE,
  DEFAULT_KINDS,
  PERSON_OBJECT,
  PERSON_SCHEMAS,
  type ClassificationRule,
  type ValueKind,
} from './classification.rules';

/**
 * Servicio de dominio puro de la clasificación automática: decide, por nombre y tipo de una
 * columna, qué nivel de sensibilidad le corresponde, y si ese resultado puede escribirse sobre lo
 * que ya hay. No toca la base ni el reloj.
 *
 * Regla de oro: ante duda, el nivel más alto y a `NEEDS_REVIEW`; con certeza, `AUTO_DETECTED`.
 * Nunca baja un nivel y nunca pisa lo que una persona tocó (`decideWrite`).
 */

/** Lo que el clasificador necesita saber de una columna. */
export interface ClassifiableColumn {
  columnName: string;
  nativeType: string;
  objectName: string;
  /** Schema del objeto; sin él, el contexto se juzga sólo por el nombre del objeto. */
  schemaName?: string;
}

export interface ClassificationProposal {
  level: Sensitivity;
  confidence: number;
  ruleId: string;
  basis: string;
  /** `AUTO_DETECTED` con certeza; `NEEDS_REVIEW` ante duda. */
  status: typeof AUTO_DETECTED_STATUS | 'NEEDS_REVIEW';
}

/** `camelCase` y `snake_case` por igual: palabras en minúscula. */
export function tokensOf(name: string): string[] {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/** Qué puede contener físicamente una columna de este tipo nativo. */
export function valueKindOf(nativeType: string): ValueKind {
  const tipo = nativeType.trim().toLowerCase();
  if (/^bool/.test(tipo)) return 'BOOLEAN';
  if (/^(timestamp|date|time|interval)/.test(tipo)) return 'TEMPORAL';
  if (
    /^(smallint|integer|bigint|int\d*|serial|bigserial|numeric|decimal|real|double|float|money)/.test(
      tipo,
    )
  )
    return 'NUMERIC';
  if (/^(inet|cidr|macaddr)/.test(tipo)) return 'NETWORK';
  if (tipo === 'uuid') return 'UUID';
  return 'TEXT';
}

/**
 * Una columna `uuid` que termina en `_id` es la clave foránea a otra tabla: lo sensible vive en la
 * tabla apuntada, que se clasifica por su cuenta. Las `*_concept_id` no entran: el concepto **es**
 * el dato (sexo, raza, medicamento codificados).
 */
function isEntityPointer(tokens: string[], kind: ValueKind): boolean {
  if (kind !== 'UUID' || tokens[tokens.length - 1] !== 'id') return false;
  return tokens.length === 1 || tokens[tokens.length - 2] !== 'concept';
}

/** Quita el sufijo `concept_id`: el valor es un código, no una referencia que degrade la regla. */
function withoutConceptSuffix(tokens: string[]): string[] {
  const n = tokens.length;
  return n >= 2 && tokens[n - 2] === 'concept' && tokens[n - 1] === 'id'
    ? tokens.slice(0, n - 2)
    : tokens;
}

const mismaPalabra = (token: string, termino: string): boolean =>
  token === termino || token === `${termino}s` || token === `${termino}es`;

/** Posición en `tokens` donde aparece `termino` (sus palabras seguidas), o -1. */
function findTerm(tokens: string[], termino: string): number {
  const palabras = termino.split('_');
  for (let i = 0; i + palabras.length <= tokens.length; i += 1)
    if (palabras.every((p, j) => mismaPalabra(tokens[i + j], p))) return i;
  return -1;
}

interface RuleMatch {
  rule: ClassificationRule;
  confidence: number;
}

/** Evalúa una regla contra una columna; `null` si no aplica. */
function match(
  rule: ClassificationRule,
  col: ClassifiableColumn,
  tokens: string[],
  kind: ValueKind,
): RuleMatch | null {
  if (!(rule.on ?? DEFAULT_KINDS).includes(kind)) return null;
  if (rule.objects && !rule.objects.test(col.objectName)) return null;
  if (rule.nativeType?.test(col.nativeType.trim()))
    return { rule, confidence: rule.confidence };
  // gana el término más específico (el de más palabras) que aparezca en el nombre
  const termino = [...(rule.terms ?? [])]
    .filter((t) => findTerm(tokens, t) >= 0)
    .sort((x, y) => y.split('_').length - x.split('_').length)[0];
  if (termino === undefined) return null;
  const desde = findTerm(tokens, termino);
  const largo = termino.split('_').length;
  const modificadores = rule.doubtTokens ?? ALL_MODIFIER_TOKENS;
  const resto = tokens.filter((_, i) => i < desde || i >= desde + largo);
  const enDuda = resto.some((t) => modificadores.has(t));
  return {
    rule,
    confidence: enDuda
      ? Math.min(rule.confidence, CONFIDENCE.AMBIGUOUS)
      : rule.confidence,
  };
}

/**
 * `true` si la columna es de una tabla de datos de personas o pacientes: un schema clínico o un
 * objeto cuyo nombre habla de personas. Fuera de ahí (catálogos, plantillas, sedes, productos) un
 * nombre que parece sensible no alcanza para afirmarlo.
 */
export function isPersonContext(col: ClassifiableColumn): boolean {
  return (
    (col.schemaName !== undefined && PERSON_SCHEMAS.has(col.schemaName)) ||
    PERSON_OBJECT.test(col.objectName)
  );
}

/**
 * Nivel que le corresponde a una columna, o `null` si ninguna regla la reconoce (queda sin
 * clasificar: no se inventa un nivel). Con varias reglas gana la de nivel más alto y, a igual
 * nivel, la de más confianza.
 */
export function classifyColumn(
  col: ClassifiableColumn,
  rules: readonly ClassificationRule[] = CLASSIFICATION_RULES,
): ClassificationProposal | null {
  const kind = valueKindOf(col.nativeType);
  const tokens = tokensOf(col.columnName);
  if (isEntityPointer(tokens, kind)) return null;
  const efectivos = withoutConceptSuffix(tokens);
  let mejor: RuleMatch | null = null;
  for (const rule of rules) {
    const m = match(rule, col, efectivos, kind);
    if (!m) continue;
    if (
      !mejor ||
      SENSITIVITY_RANK[m.rule.level] > SENSITIVITY_RANK[mejor.rule.level] ||
      (m.rule.level === mejor.rule.level && m.confidence > mejor.confidence)
    )
      mejor = m;
  }
  if (!mejor) return null;
  // La certeza exige contexto de personas. Fuera de él la misma regla baja a duda: mismo nivel
  // (nunca uno menor) y a revisión. Una credencial lo es en cualquier tabla.
  const confidence =
    mejor.rule.level === 'CREDENTIAL' || isPersonContext(col)
      ? mejor.confidence
      : Math.min(mejor.confidence, CONFIDENCE.AMBIGUOUS);
  return {
    level: mejor.rule.level,
    confidence,
    ruleId: mejor.rule.id,
    basis: mejor.rule.basis,
    status:
      confidence >= CERTAINTY_THRESHOLD ? AUTO_DETECTED_STATUS : 'NEEDS_REVIEW',
  };
}

/** Valores que guardó la API antes del vocabulario nuevo, llevados a su equivalente para comparar niveles. */
const LEGACY_SENSITIVITY: Readonly<Record<string, Sensitivity>> = {
  NONE: 'UNKNOWN',
  PII: 'PERSONAL',
  // ambiguo entre los tres PHI_*: al más alto, como manda la regla de oro
  PHI: 'PHI_SPECIAL',
  SECRET: 'CREDENTIAL',
};

/** Posición en la escala de un valor guardado, aunque sea de un vocabulario anterior. */
export function rankOf(valor: string): number {
  const nivel = LEGACY_SENSITIVITY[valor] ?? (valor as Sensitivity);
  return SENSITIVITY_RANK[nivel] ?? 0;
}

/** Lo que `decideWrite` necesita saber de la ficha que ya existe. */
export interface ExistingAnnotation {
  origin: AnnotationOrigin;
  reviewStatus: ReviewStatus;
  sensitivity: string;
}

export type SkipReason = 'MANUAL' | 'REVIEWED' | 'NOT_HIGHER';

export type WriteDecision =
  | { action: 'CREATE' }
  | { action: 'RAISE' }
  | { action: 'SKIP'; reason: SkipReason };

/**
 * Qué hacer con una propuesta frente a lo que ya hay:
 * - sin ficha: crearla;
 * - la escribió una persona (`origin` distinto de la clasificación automática): no se toca;
 * - ya salió de `AUTO_DETECTED` (en revisión, aprobada, rechazada, borrador): no se toca;
 * - sigue como la dejó la máquina y la propuesta es **más alta**: se sube; si es igual o menor,
 *   no se baja ni se reescribe.
 */
export function decideWrite(
  existing: ExistingAnnotation | null,
  proposal: ClassificationProposal,
): WriteDecision {
  if (!existing) return { action: 'CREATE' };
  if (existing.origin !== 'AUTO_CLASSIFIER')
    return { action: 'SKIP', reason: 'MANUAL' };
  if (existing.reviewStatus !== AUTO_DETECTED_STATUS)
    return { action: 'SKIP', reason: 'REVIEWED' };
  if (SENSITIVITY_RANK[proposal.level] <= rankOf(existing.sensitivity))
    return { action: 'SKIP', reason: 'NOT_HIGHER' };
  return { action: 'RAISE' };
}
