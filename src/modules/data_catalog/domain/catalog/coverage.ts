import {
  COVERAGE_MODEL_VERSION,
  REQUIRED_SEMANTIC_FIELDS,
  type ReviewStatus,
  type Sensitivity,
} from './catalog.constants';

/** Lo mínimo de una ficha que la cobertura necesita. */
export interface CoverageAnnotation {
  purpose: string | null;
  existenceRationale: string | null;
  rowGrain: string | null;
  businessOwner: string | null;
  dataSteward: string | null;
  sensitivity: Sensitivity;
  openQuestions: { field?: string }[];
  reviewStatus: ReviewStatus;
  currentRevisionNo: number;
  approvedRevisionNo: number | null;
}

export interface ObjectCoverage {
  technical: 'COMPLETE' | 'INCOMPLETE';
  semantic: 'COMPLETE' | 'DECLARED_DEBT' | 'MISSING';
  ownership: 'COMPLETE' | 'MISSING';
  sensitivity: 'KNOWN' | 'UNKNOWN';
  review: 'APPROVED_CURRENT' | 'NOT_APPROVED';
  missingFields: string[];
}

const answered = (v: string | null | undefined): boolean =>
  typeof v === 'string' && v.trim().length > 0;

/**
 * Cobertura de un objeto observado. La ficha es opcional: sin ella, todo lo semántico falta.
 *
 * Técnico: el objeto tiene al menos una columna observada. Semántico: propósito, razón de
 * existir y grano de fila contestados (`COMPLETE`), o los que faltan declarados como preguntas
 * abiertas (`DECLARED_DEBT`: una deuda que alguien reconoció), o faltantes (`MISSING`).
 */
export function coverageOfObject(
  columnCount: number,
  a: CoverageAnnotation | null,
): ObjectCoverage {
  const faltan = REQUIRED_SEMANTIC_FIELDS.filter(
    (campo) => !answered(a?.[campo]),
  );
  const declaradas = new Set((a?.openQuestions ?? []).map((q) => q.field));
  const missingFields: string[] = [...faltan];
  const owner = answered(a?.businessOwner) || answered(a?.dataSteward);
  if (!owner) missingFields.push('businessOwner');
  const sensible = Boolean(a) && a!.sensitivity !== 'UNKNOWN';
  if (!sensible) missingFields.push('sensitivity');
  return {
    technical: columnCount > 0 ? 'COMPLETE' : 'INCOMPLETE',
    semantic:
      faltan.length === 0
        ? 'COMPLETE'
        : faltan.every((f) => declaradas.has(f))
          ? 'DECLARED_DEBT'
          : 'MISSING',
    ownership: owner ? 'COMPLETE' : 'MISSING',
    sensitivity: sensible ? 'KNOWN' : 'UNKNOWN',
    review:
      a &&
      a.reviewStatus === 'APPROVED' &&
      a.approvedRevisionNo === a.currentRevisionNo
        ? 'APPROVED_CURRENT'
        : 'NOT_APPROVED',
    missingFields,
  };
}

export type DimensionStatus = 'MEASURED' | 'NOT_APPLICABLE' | 'UNKNOWN';

export interface DimensionSummary {
  status: DimensionStatus;
  covered: number;
  denominator: number;
  /** `null` cuando no hay nada que dividir: nunca un 0 % ni un 100 % inventado. */
  ratio: number | null;
}

export interface CoverageSummary {
  modelVersion: string;
  denominator: number;
  declaredDebt: number;
  dimensions: Record<
    'technical' | 'semantic' | 'ownership' | 'sensitivity' | 'review',
    DimensionSummary
  >;
}

/** Agrega la cobertura de los objetos observados (el universo ya viene filtrado por el alcance). */
export function summarizeCoverage(items: ObjectCoverage[]): CoverageSummary {
  const denominator = items.length;
  const dimension = (cubiertos: number): DimensionSummary =>
    denominator === 0
      ? { status: 'NOT_APPLICABLE', covered: 0, denominator: 0, ratio: null }
      : {
          status: 'MEASURED',
          covered: cubiertos,
          denominator,
          ratio: Math.round((cubiertos / denominator) * 10_000) / 10_000,
        };
  return {
    modelVersion: COVERAGE_MODEL_VERSION,
    denominator,
    declaredDebt: items.filter((c) => c.semantic === 'DECLARED_DEBT').length,
    dimensions: {
      technical: dimension(
        items.filter((c) => c.technical === 'COMPLETE').length,
      ),
      semantic: dimension(
        items.filter((c) => c.semantic === 'COMPLETE').length,
      ),
      ownership: dimension(
        items.filter((c) => c.ownership === 'COMPLETE').length,
      ),
      sensitivity: dimension(
        items.filter((c) => c.sensitivity === 'KNOWN').length,
      ),
      review: dimension(
        items.filter((c) => c.review === 'APPROVED_CURRENT').length,
      ),
    },
  };
}
