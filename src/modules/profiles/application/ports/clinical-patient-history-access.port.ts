import type { AuthenticatedUser } from '../../../../common';

/** Autorización clínica requerida antes de mostrar la ficha de filiación. */
export interface ClinicalPatientHistoryAccessPort {
  assertCanReadHistory(
    profileId: string,
    actor: AuthenticatedUser,
  ): Promise<void>;
}

export const CLINICAL_PATIENT_HISTORY_ACCESS_PORT = Symbol(
  'CLINICAL_PATIENT_HISTORY_ACCESS_PORT',
);
