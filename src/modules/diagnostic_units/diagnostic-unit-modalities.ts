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
    // El alta del laboratorio declara esta modalidad (BR-09): sin ella, la regla
    // «una modalidad desconocida es 422» dejaría a los laboratorios sin poder darse de alta.
    conceptId: DUNIT.MODALITY_LABORATORY,
    studyCode: 'MODALITY_LABORATORY',
    displayName: 'Laboratorio',
  },
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

/**
 * Lo que mira {@link resolveDiagnosticUnitType} del alta de una unidad.
 */
export interface DiagnosticUnitTypeHints {
  readonly diagnosticUnitTypeConceptId?: string;
  readonly modalityConceptIds?: readonly string[];
}

/**
 * El tipo de la unidad diagnóstica que nace con un alta (P51, decisión D-1).
 *
 * El tipo explícito siempre manda. Sin él, se infiere de las modalidades:
 * alguna de imágenes (cualquiera distinta de `DU_MODALITY_LAB`) → unidad de
 * imágenes; en cualquier otro caso —sólo laboratorio, sucursales, o nada— →
 * laboratorio clínico. Antes el valor por omisión era imágenes a secas, y el
 * alta de laboratorio que no mandaba el tipo terminaba como centro de
 * imágenes.
 *
 * @param hints - Tipo y modalidades declarados.
 * @returns El concepto `DUNIT.UNIT_TYPE_*` que corresponde.
 */
export function resolveDiagnosticUnitType(
  hints: DiagnosticUnitTypeHints,
): string {
  if (hints.diagnosticUnitTypeConceptId !== undefined) {
    return hints.diagnosticUnitTypeConceptId;
  }
  const declaresImaging = (hints.modalityConceptIds ?? []).some(
    (conceptId) => conceptId !== DUNIT.MODALITY_LABORATORY,
  );
  return declaresImaging ? DUNIT.UNIT_TYPE_IMAGING : DUNIT.UNIT_TYPE_LABORATORY;
}
