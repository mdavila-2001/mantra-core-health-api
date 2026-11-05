/**
 * How much of a patient's history the actor may read.
 *
 * - `FULL`: the whole record (owner, representative, superadmin, attending
 *   clinician, cabecera, manual or emergency grant).
 * - `SPECIALTIES`: only the three IPS sections plus whatever was recorded by
 *   practitioners of the listed specialties (granular patient consent).
 *
 * The specialties are `VS_MEDICAL_SPECIALTY` concept ids, never enum values.
 */
export type ClinicalReadScope =
  | { readonly kind: 'FULL' }
  | {
      readonly kind: 'SPECIALTIES';
      readonly specialtyConceptIds: readonly string[];
    };

export const FULL_READ_SCOPE: ClinicalReadScope = { kind: 'FULL' };

/**
 * The most restrictive scope: IPS sections only. It is what a reader gets when
 * no scope reached it, so a missing scope never widens access.
 */
export const IPS_ONLY_READ_SCOPE: ClinicalReadScope = {
  kind: 'SPECIALTIES',
  specialtyConceptIds: [],
};

/** Builds a SPECIALTIES scope without duplicated ids. */
export function specialtiesScope(
  specialtyConceptIds: Iterable<string>,
): ClinicalReadScope {
  return {
    kind: 'SPECIALTIES',
    specialtyConceptIds: [...new Set(specialtyConceptIds)],
  };
}

export function isFullScope(scope: ClinicalReadScope): boolean {
  return scope.kind === 'FULL';
}
