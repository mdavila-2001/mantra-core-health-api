import type { EntityManager } from '@mikro-orm/postgresql';

export interface PatientCoveragesPort {
  read<T>(em: EntityManager, patientProfileId: string): Promise<T[]>;
  isDeclared(
    em: EntityManager,
    patientProfileId: string,
    order: number,
  ): Promise<boolean>;
  create(
    em: EntityManager,
    input: {
      patientProfileId: string;
      insurancePlanId: string;
      expectedSector: 'private' | 'public';
      coverageOrder: number;
      memberIdentifier: string;
      actorUserId: string;
    },
  ): Promise<void>;
}

export const PATIENT_COVERAGES_PORT = Symbol('PATIENT_COVERAGES_PORT');
