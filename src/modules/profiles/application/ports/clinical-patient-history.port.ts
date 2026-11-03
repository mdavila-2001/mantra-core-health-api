import type { AuthenticatedUser } from '../../../../common';

/** Decides whether a clinician may read the patient's clinical history. */
export interface ClinicalPatientHistoryPort {
  assertCanReadHistory(
    patientProfileId: string,
    actor: AuthenticatedUser,
  ): Promise<void>;
}

export const CLINICAL_PATIENT_HISTORY_PORT = Symbol(
  'PROFILES_CLINICAL_PATIENT_HISTORY_PORT',
);
