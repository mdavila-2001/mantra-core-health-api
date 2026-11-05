import { CLIN } from './clinical.concepts';

/** Quién ejecuta una orden, según la recomendación del médico. */
export type PerformerSelectionCode = 'SELF' | 'ORGANIZATION' | 'PATIENT_CHOICE';

/**
 * Concepto de cada modo. El contrato los nombra `SELF`, `ORGANIZATION` y
 * `PATIENT_CHOICE`; el código del concepto (`SR_PERF_*`) lo fija
 * `clinical.concepts.ts`.
 */
export const PERFORMER_SELECTION_CONCEPTS: Readonly<
  Record<PerformerSelectionCode, string>
> = {
  SELF: CLIN.SERVICE_REQUEST_PERFORMER_SELF,
  ORGANIZATION: CLIN.SERVICE_REQUEST_PERFORMER_ORGANIZATION,
  PATIENT_CHOICE: CLIN.SERVICE_REQUEST_PERFORMER_PATIENT_CHOICE,
};

/** Modo de una orden que no declara ninguno: que elija el paciente. */
export const DEFAULT_PERFORMER_SELECTION_CONCEPT =
  PERFORMER_SELECTION_CONCEPTS.PATIENT_CHOICE;

const CODE_BY_CONCEPT: ReadonlyMap<string, PerformerSelectionCode> = new Map(
  (
    Object.entries(PERFORMER_SELECTION_CONCEPTS) as [
      PerformerSelectionCode,
      string,
    ][]
  ).map(([code, conceptId]) => [conceptId, code]),
);

/**
 * El modo que corresponde a un concepto.
 *
 * @param conceptId - Concepto recibido.
 * @returns El modo, o `undefined` si el concepto no es del conjunto.
 */
export function performerSelectionCodeOf(
  conceptId: string,
): PerformerSelectionCode | undefined {
  return CODE_BY_CONCEPT.get(conceptId);
}
