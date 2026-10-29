import type {
  GlossaryNeighborDto,
  GlossaryNeighborQualifiersDto,
} from '../dto';
import {
  GLOSSARY_EVIDENCE_TIERS,
  GLOSSARY_RELATION_FREQUENCIES,
  type GlossaryEvidenceTier,
  type GlossaryRelationFrequency,
} from '../glossary.constants';
import type { RelationshipEvidenceSummary } from '../repositories';

/**
 * Lo que el vecindario del glosario necesita saber de la arista que une al
 * término central con un vecino (TAREA-41 F1.5). Sale de las columnas
 * derivadas que recalcula el cargador `bulk-copy.mjs`; la API no las escribe.
 */
export interface NeighborEdgeFacts {
  /** Id de la relación; sin él no se puede leer su evidencia. */
  readonly relationshipId?: string;
  /** `strength_score` ya convertido a número; `undefined` si es `NULL`. */
  readonly strength?: number;
  readonly frequencyConceptId?: string;
  readonly evidenceTierConceptId?: string;
  readonly evidenceCount: number;
}

/** Un vecino con su nombre y los datos de su arista, listo para ordenar. */
export interface RankedNeighbor extends NeighborEdgeFacts {
  readonly conceptId: string;
  readonly slug: string;
  readonly display: string;
}

/**
 * `strength_score` llega como texto (`numeric` de Postgres): número si es un
 * valor finito, `undefined` si la relación todavía no tiene evidencia.
 */
export function parseStrengthScore(
  score: string | number | null | undefined,
): number | undefined {
  if (score === null || score === undefined || score === '') return undefined;
  const value = Number(score);
  return Number.isFinite(value) ? value : undefined;
}

/**
 * Orden de un grupo del vecindario (§5): `strength_score DESC NULLS LAST`,
 * después el nombre en castellano y, para que el orden sea total, el id.
 */
export function compareRankedNeighbors(
  a: RankedNeighbor,
  b: RankedNeighbor,
): number {
  const byStrength = (b.strength ?? -1) - (a.strength ?? -1);
  if (byStrength !== 0) return byStrength;
  return (
    a.display.localeCompare(b.display, 'es') ||
    a.conceptId.localeCompare(b.conceptId)
  );
}

/**
 * Entre dos aristas hacia el mismo vecino dentro de un grupo, se queda la más
 * fuerte. Con la clave natural única de F1 no debería haber dos, pero el
 * vecindario no depende de eso.
 */
export function strongerEdge<T extends NeighborEdgeFacts>(
  current: T | undefined,
  candidate: T,
): T {
  if (current === undefined) return candidate;
  return (candidate.strength ?? -1) > (current.strength ?? -1)
    ? candidate
    : current;
}

const EVIDENCE_TIER_CODES: ReadonlySet<string> = new Set(
  GLOSSARY_EVIDENCE_TIERS,
);
const FREQUENCY_CODES: ReadonlySet<string> = new Set(
  GLOSSARY_RELATION_FREQUENCIES,
);

/** El código del value set como nivel de evidencia, o `undefined` si no lo es. */
export function asEvidenceTier(
  code: string | undefined,
): GlossaryEvidenceTier | undefined {
  return code !== undefined && EVIDENCE_TIER_CODES.has(code)
    ? (code as GlossaryEvidenceTier)
    : undefined;
}

/** El código del value set como frecuencia, o `undefined` si no lo es. */
export function asRelationFrequency(
  code: string | undefined,
): GlossaryRelationFrequency | undefined {
  return code !== undefined && FREQUENCY_CODES.has(code)
    ? (code as GlossaryRelationFrequency)
    : undefined;
}

/**
 * El valor que todas las evidencias comparten, o `undefined` si alguna no lo
 * declara o si declaran valores distintos: una restricción que no comparten
 * todas las fuentes no restringe la relación.
 */
function sharedValue<T>(values: readonly (T | null)[]): T | undefined {
  const [first] = values;
  if (first === null || first === undefined) return undefined;
  return values.every((value) => value === first) ? first : undefined;
}

/** Extremo de un rango de edad, sólo si todas las evidencias lo acotan. */
function boundedAge(
  values: readonly (number | null)[],
  pick: (...ages: number[]) => number,
): number | undefined {
  if (values.length === 0 || values.some((value) => value === null)) {
    return undefined;
  }
  return pick(...(values as number[]));
}

/**
 * Los calificadores de una relación a partir de todas sus evidencias.
 * Devuelve `undefined` cuando ninguno se sostiene en todas.
 */
export function summarizeQualifiers(
  evidence: readonly RelationshipEvidenceSummary[],
): GlossaryNeighborQualifiersDto | undefined {
  const qualifiers: GlossaryNeighborQualifiersDto = {};
  const sex = sharedValue(evidence.map((row) => row.sexCode));
  const ageMinDays = boundedAge(
    evidence.map((row) => row.ageMinDays),
    Math.min,
  );
  const ageMaxDays = boundedAge(
    evidence.map((row) => row.ageMaxDays),
    Math.max,
  );
  const pregnancy = sharedValue(evidence.map((row) => row.pregnancyCode));
  const careLevel = sharedValue(evidence.map((row) => row.careLevelCode));
  const lineOfTherapy = sharedValue(
    evidence.map((row) => row.lineOfTherapyCode),
  );
  if (sex !== undefined) qualifiers.sex = sex;
  if (ageMinDays !== undefined) qualifiers.ageMinDays = ageMinDays;
  if (ageMaxDays !== undefined) qualifiers.ageMaxDays = ageMaxDays;
  if (pregnancy !== undefined) qualifiers.pregnancy = pregnancy;
  if (careLevel !== undefined) qualifiers.careLevel = careLevel;
  if (lineOfTherapy !== undefined) qualifiers.lineOfTherapy = lineOfTherapy;
  return Object.keys(qualifiers).length > 0 ? qualifiers : undefined;
}

/** Los campos de evidencia de un vecino; sólo los que tienen valor. */
export type NeighborEvidenceFields = Pick<
  GlossaryNeighborDto,
  'strength' | 'frequency' | 'evidenceTier' | 'sourceCodes' | 'qualifiers'
>;

/**
 * Arma los campos opcionales de un vecino. Ninguno viaja como `undefined` ni
 * como `null`: si no hay dato, la clave no existe y el JSON queda igual que
 * antes de F1.
 *
 * @param edge - La arista del vecino.
 * @param codeOf - Código de un concepto (nivel o frecuencia) por id.
 * @param evidence - Las evidencias de esa arista (vacío si no tiene).
 */
export function neighborEvidenceFields(
  edge: NeighborEdgeFacts,
  codeOf: (conceptId: string | undefined) => string | undefined,
  evidence: readonly RelationshipEvidenceSummary[],
): NeighborEvidenceFields {
  const fields: NeighborEvidenceFields = {};
  if (edge.strength !== undefined) fields.strength = edge.strength;
  const frequency = asRelationFrequency(codeOf(edge.frequencyConceptId));
  if (frequency !== undefined) fields.frequency = frequency;
  const evidenceTier = asEvidenceTier(codeOf(edge.evidenceTierConceptId));
  if (evidenceTier !== undefined) fields.evidenceTier = evidenceTier;
  const sourceCodes = [
    ...new Set(evidence.map((row) => row.sourceReference)),
  ].sort((a, b) => a.localeCompare(b));
  if (sourceCodes.length > 0) fields.sourceCodes = sourceCodes;
  const qualifiers = summarizeQualifiers(evidence);
  if (qualifiers !== undefined) fields.qualifiers = qualifiers;
  return fields;
}
