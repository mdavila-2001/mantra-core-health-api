import type {
  AnnotationContent,
  AnnotationField,
  ObservationStatus,
  ReviewStatus,
} from './catalog.model';
import { OBJECT_REQUIRED_ON_SUBMIT } from './annotation.policy';

/**
 * Cobertura del catálogo. Se calcula en el backend y se entrega explicada:
 * denominador, faltantes y versión del modelo de cálculo. El portal no inventa
 * porcentajes; muestra éstos.
 *
 * Cambiar qué cuenta como cubierto es cambiar el significado del número: por
 * eso el modelo lleva versión y viaja en cada respuesta.
 */
export const COVERAGE_MODEL_VERSION = 'catalog-coverage/v1';

export const COVERAGE_DIMENSIONS = [
  'technical',
  'semantic',
  'ownership',
  'sensitivity',
  'review',
] as const;
export type CoverageDimension = (typeof COVERAGE_DIMENSIONS)[number];

export interface ObjectCoverageInput {
  observationStatus: ObservationStatus;
  columnCount: number;
  annotation: {
    content: AnnotationContent;
    reviewStatus: ReviewStatus;
    currentRevisionNo: number;
    approvedRevisionNo: number | null;
  } | null;
  /** El registro de gobierno (`system_ops.entity_registry`) ya declara PII/PHI. */
  registrySensitivityKnown: boolean;
}

export type SemanticState = 'COMPLETE' | 'DECLARED_DEBT' | 'MISSING';

export interface ObjectCoverage {
  technical: boolean;
  semantic: SemanticState;
  ownership: boolean;
  sensitivity: boolean;
  review: boolean;
  missingFields: AnnotationField[];
}

/** Cobertura de un objeto observado. */
export function objectCoverage(input: ObjectCoverageInput): ObjectCoverage {
  const content = input.annotation?.content ?? null;
  const declared = new Set(
    (content?.openQuestions ?? [])
      .map((question) => question.field)
      .filter(Boolean),
  );
  const semanticMissing = OBJECT_REQUIRED_ON_SUBMIT.filter((field) => {
    const value = content?.[field];
    return value === null || value === undefined || value === '';
  });
  const semantic: SemanticState =
    semanticMissing.length === 0
      ? 'COMPLETE'
      : semanticMissing.every((field) => declared.has(field))
        ? 'DECLARED_DEBT'
        : 'MISSING';

  const missingFields: AnnotationField[] = [...semanticMissing];
  const ownership = Boolean(content?.businessOwner || content?.dataSteward);
  if (!ownership) missingFields.push('businessOwner');

  const sensitivity =
    (content !== null && content.sensitivity !== 'UNKNOWN') ||
    input.registrySensitivityKnown;
  if (!sensitivity) missingFields.push('sensitivity');

  const review =
    input.annotation !== null &&
    input.annotation.reviewStatus === 'APPROVED' &&
    input.annotation.approvedRevisionNo === input.annotation.currentRevisionNo;

  return {
    technical: input.observationStatus === 'OBSERVED' && input.columnCount > 0,
    semantic,
    ownership,
    sensitivity,
    review,
    missingFields,
  };
}

export type DimensionStatus = 'MEASURED' | 'NOT_APPLICABLE' | 'UNKNOWN';

export interface DimensionSummary {
  status: DimensionStatus;
  covered: number;
  denominator: number;
  /** `null` cuando no hay nada que dividir: nunca un 100% ni un 0% inventado. */
  ratio: number | null;
}

export interface CoverageSummary {
  modelVersion: string;
  denominator: number;
  dimensions: Record<CoverageDimension, DimensionSummary>;
  /** Objetos cuya semántica falta pero está declarada como deuda con pregunta abierta. */
  declaredDebt: number;
}

/**
 * Agrega la cobertura de los objetos observados de un alcance.
 *
 * - Sin ningún escaneo terminado, todo es UNKNOWN: la ausencia de datos no es
 *   ausencia de tablas.
 * - Con escaneo pero sin objetos en el alcance, es NOT_APPLICABLE (0/0).
 */
export function summarizeCoverage(
  coverages: readonly ObjectCoverage[],
  hasCompletedScan: boolean,
): CoverageSummary {
  const denominator = coverages.length;
  const status: DimensionStatus = !hasCompletedScan
    ? 'UNKNOWN'
    : denominator === 0
      ? 'NOT_APPLICABLE'
      : 'MEASURED';

  const count = (predicate: (coverage: ObjectCoverage) => boolean) =>
    coverages.filter(predicate).length;
  const dimension = (covered: number): DimensionSummary => ({
    status,
    covered: status === 'MEASURED' ? covered : 0,
    denominator: status === 'UNKNOWN' ? 0 : denominator,
    ratio:
      status === 'MEASURED'
        ? Math.round((covered / denominator) * 10_000) / 10_000
        : null,
  });

  return {
    modelVersion: COVERAGE_MODEL_VERSION,
    denominator: status === 'UNKNOWN' ? 0 : denominator,
    dimensions: {
      technical: dimension(count((c) => c.technical)),
      semantic: dimension(count((c) => c.semantic === 'COMPLETE')),
      ownership: dimension(count((c) => c.ownership)),
      sensitivity: dimension(count((c) => c.sensitivity)),
      review: dimension(count((c) => c.review)),
    },
    declaredDebt: count((c) => c.semantic === 'DECLARED_DEBT'),
  };
}
