import { DUNIT } from './diagnostic_units.concepts';

/**
 * Una modalidad diagnóstica ofrecible al dar de alta una unidad.
 */
export interface DiagnosticUnitModality {
  /** Concepto de `VS_BO_DEPARTMENT`-style: uno de los `DUNIT.MODALITY_*`. */
  readonly conceptId: string;
  /**
   * Código de la oferta genérica que materializa esta modalidad
   * (`diagnostic_study_offerings.study_code`).
   */
  readonly studyCode: string;
  /** Rótulo en castellano, el mismo que ve el paciente en la oferta. */
  readonly displayName: string;
}

/**
 * Las modalidades que el alta de un centro de diagnóstico puede declarar.
 *
 * Lista cerrada, no el catálogo de terminología: son las seis del formulario
 * del centro de imagenología (subtarea 1.5, PR #404 del front — «RAYOS X,
 * RESONANCIA, ETC.», handoff `alta-centro-imagenologia.md`). Declarar una
 * modalidad fuera de esta lista es un 422, no un 500 por FK inexistente.
 *
 * Cada una se materializa como una `diagnostic_study_offerings` genérica
 * (`DUNIT.STUDY_GENERIC` + `modalityConceptId`): es de ahí de donde
 * `DiagnosticUnitsReadService` deriva hoy las modalidades que expone una
 * unidad en el directorio público (`optionalConcept(…, offering.modalityConceptId)`).
 */
export const DIAGNOSTIC_UNIT_MODALITIES: readonly DiagnosticUnitModality[] = [
  {
    conceptId: DUNIT.MODALITY_XRAY,
    studyCode: 'MODALITY_XRAY',
    displayName: 'Rayos X',
  },
  {
    conceptId: DUNIT.MODALITY_ULTRASOUND,
    studyCode: 'MODALITY_ULTRASOUND',
    displayName: 'Ecografía',
  },
  {
    conceptId: DUNIT.MODALITY_CT,
    studyCode: 'MODALITY_CT',
    displayName: 'Tomografía computarizada',
  },
  {
    conceptId: DUNIT.MODALITY_MRI,
    studyCode: 'MODALITY_MRI',
    displayName: 'Resonancia magnética',
  },
  {
    conceptId: DUNIT.MODALITY_MAMMOGRAPHY,
    studyCode: 'MODALITY_MAMMOGRAPHY',
    displayName: 'Mamografía',
  },
  {
    conceptId: DUNIT.MODALITY_BONE_DENSITOMETRY,
    studyCode: 'MODALITY_BONE_DENSITOMETRY',
    displayName: 'Densitometría ósea',
  },
];

const MODALITY_BY_CONCEPT_ID: ReadonlyMap<string, DiagnosticUnitModality> =
  new Map(DIAGNOSTIC_UNIT_MODALITIES.map((m) => [m.conceptId, m]));

/**
 * Si `conceptId` es una de las modalidades declarables.
 *
 * @param conceptId - El uuid a comprobar.
 * @returns `true` si pertenece a {@link DIAGNOSTIC_UNIT_MODALITIES}.
 */
export function isDiagnosticUnitModality(conceptId: string): boolean {
  return MODALITY_BY_CONCEPT_ID.has(conceptId);
}

/**
 * La modalidad declarada, con su código de estudio y rótulo.
 *
 * @param conceptId - El uuid a resolver.
 * @returns La modalidad, o `undefined` si no pertenece a la lista cerrada.
 */
export function findDiagnosticUnitModality(
  conceptId: string,
): DiagnosticUnitModality | undefined {
  return MODALITY_BY_CONCEPT_ID.get(conceptId);
}
