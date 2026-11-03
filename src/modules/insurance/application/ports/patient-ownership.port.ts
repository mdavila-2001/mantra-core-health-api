import type { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../../common';

export interface PatientOwnershipPort {
  assertOwnsPatientProfile(
    em: EntityManager,
    patientProfileId: string,
    actor: AuthenticatedUser,
  ): Promise<void>;
}

export const PATIENT_OWNERSHIP_PORT = Symbol(
  'INSURANCE_PATIENT_OWNERSHIP_PORT',
);
