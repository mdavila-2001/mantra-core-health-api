import { PreconditionFailedException } from '../../common';
import { assertSpecimenTypeInCatalog } from '../diagnostics/specimen-catalogs';
import { DUNIT } from '../diagnostic_units/diagnostic_units.concepts';
import { isDiagnosticUnitModality } from '../diagnostic_units/diagnostic-unit-modalities';
import { CLIN } from './clinical.concepts';
import { ClinicalErrorReason } from './clinical.error-reasons';
import type { AnalysisCategory } from './service-request-category';

/**
 * El detalle de una orden de estudio (v4.2.82 del modelo): la muestra si es de
 * laboratorio; la modalidad, la región, la lateralidad y el contraste si es de
 * imagen. Todo opcional: una orden anterior, o «estudio completo», no lo trae.
 */
export interface ServiceRequestDetail {
  readonly specimenTypeConceptId?: string;
  readonly modalityConceptId?: string;
  readonly bodySiteConceptId?: string;
  readonly lateralityConceptId?: string;
  readonly contrastConceptId?: string;
}

const IMAGING_FIELDS = [
  'modalityConceptId',
  'bodySiteConceptId',
  'lateralityConceptId',
  'contrastConceptId',
] as const;

const REGIONS: ReadonlySet<string> = new Set([
  CLIN.SERVICE_REQUEST_REGION_HEAD_NECK,
  CLIN.SERVICE_REQUEST_REGION_BACK_SPINE,
  CLIN.SERVICE_REQUEST_REGION_THORAX,
  CLIN.SERVICE_REQUEST_REGION_ABDOMEN,
  CLIN.SERVICE_REQUEST_REGION_PELVIS,
  CLIN.SERVICE_REQUEST_REGION_UPPER_LIMB,
  CLIN.SERVICE_REQUEST_REGION_LOWER_LIMB,
]);

const CONTRASTS: ReadonlySet<string> = new Set([
  CLIN.SERVICE_REQUEST_CONTRAST_NONE,
  CLIN.SERVICE_REQUEST_CONTRAST_WITH,
  CLIN.SERVICE_REQUEST_CONTRAST_BOTH,
]);

const LATERALITIES: ReadonlySet<string> = new Set([
  CLIN.CONDITION_LATERALITY_LEFT,
  CLIN.CONDITION_LATERALITY_RIGHT,
  CLIN.CONDITION_LATERALITY_BILATERAL,
]);

function notInCatalog(
  field: string,
  catalog: string,
  conceptId: string,
): PreconditionFailedException {
  return new PreconditionFailedException(
    'El valor no pertenece al catálogo de ese campo',
    { field, catalog, conceptId },
    ClinicalErrorReason.SERVICE_REQUEST_DETAIL_NOT_IN_CATALOG,
  );
}

/**
 * Valida el detalle de la orden antes de escribir nada (422 si no cierra).
 *
 * Los CHECK de la base dicen lo que se puede decir sin leer conceptos; acá va
 * el resto: el cruce con la categoría (muestra sólo en laboratorio, imagen sólo
 * en imagenología) y la pertenencia de cada valor a su catálogo.
 *
 * @param category - Categoría de la orden, o `undefined` si no la declara.
 * @param detail - El detalle recibido.
 * @throws PreconditionFailedException con `details.reason` estable.
 */
export function assertServiceRequestDetail(
  category: AnalysisCategory | undefined,
  detail: ServiceRequestDetail,
): void {
  const hasSpecimen = detail.specimenTypeConceptId !== undefined;
  const imagingFields = IMAGING_FIELDS.filter((f) => detail[f] !== undefined);
  if (!hasSpecimen && imagingFields.length === 0) return;

  const notForCategory = (fields: readonly string[], expected: string) =>
    new PreconditionFailedException(
      `Esos datos sólo corresponden a una orden de ${expected}`,
      { fields, category: category ?? null },
      ClinicalErrorReason.SERVICE_REQUEST_DETAIL_NOT_FOR_CATEGORY,
    );
  if (hasSpecimen && category !== 'LAB') {
    throw notForCategory(['specimenTypeConceptId'], 'laboratorio');
  }
  if (imagingFields.length > 0 && category !== 'IMAGING') {
    throw notForCategory(imagingFields, 'imagenología');
  }

  if (detail.specimenTypeConceptId !== undefined) {
    assertSpecimenTypeInCatalog(detail.specimenTypeConceptId);
  }
  const { modalityConceptId, bodySiteConceptId } = detail;
  if (
    modalityConceptId !== undefined &&
    (modalityConceptId === DUNIT.MODALITY_LABORATORY ||
      !isDiagnosticUnitModality(modalityConceptId))
  ) {
    throw notInCatalog(
      'modalityConceptId',
      'diagnostic-modality',
      modalityConceptId,
    );
  }
  if (bodySiteConceptId !== undefined && !REGIONS.has(bodySiteConceptId)) {
    throw notInCatalog(
      'bodySiteConceptId',
      'service-request-body-region',
      bodySiteConceptId,
    );
  }
  if (
    detail.lateralityConceptId !== undefined &&
    !LATERALITIES.has(detail.lateralityConceptId)
  ) {
    throw notInCatalog(
      'lateralityConceptId',
      'condition-laterality',
      detail.lateralityConceptId,
    );
  }
  if (
    detail.contrastConceptId !== undefined &&
    !CONTRASTS.has(detail.contrastConceptId)
  ) {
    throw notInCatalog(
      'contrastConceptId',
      'service-request-contrast',
      detail.contrastConceptId,
    );
  }

  if (
    detail.lateralityConceptId !== undefined &&
    bodySiteConceptId === undefined
  ) {
    throw new PreconditionFailedException(
      'La lateralidad necesita la región del cuerpo',
      { field: 'lateralityConceptId', requires: 'bodySiteConceptId' },
      ClinicalErrorReason.SERVICE_REQUEST_DETAIL_DEPENDENCY,
    );
  }
  if (
    detail.contrastConceptId !== undefined &&
    modalityConceptId === undefined
  ) {
    throw new PreconditionFailedException(
      'El contraste necesita la modalidad del estudio',
      { field: 'contrastConceptId', requires: 'modalityConceptId' },
      ClinicalErrorReason.SERVICE_REQUEST_DETAIL_DEPENDENCY,
    );
  }
}
