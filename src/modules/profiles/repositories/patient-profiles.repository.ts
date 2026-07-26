import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PatientProfiles } from '../entities';
import { createdBy } from '../../../common';

/** Datos del perfil de paciente (PK = person_profiles.id, 1:1). */
export interface CreatePatientProfileData {
  profileId: string;
  patientCode: string;
  masterPatientIndexCode?: string;
  recordLinkageStatusConceptId: string;
  actorUserId?: string;
}

/** Acceso a datos de `profiles.patient_profiles`. */
@Injectable()
export class PatientProfilesRepository {
  findById(em: EntityManager, profileId: string): Promise<PatientProfiles | null> {
    return em.findOne(PatientProfiles, { profileId });
  }

  /** Verifica unicidad de patient_code (uq_patient_profiles_patient_code). */
  findByPatientCode(em: EntityManager, patientCode: string): Promise<PatientProfiles | null> {
    return em.findOne(PatientProfiles, { patientCode });
  }

  create(em: EntityManager, data: CreatePatientProfileData): PatientProfiles {
    return em.create(
      PatientProfiles,
      {
        profileId: data.profileId,
        patientCode: data.patientCode,
        masterPatientIndexCode: data.masterPatientIndexCode,
        recordLinkageStatusConceptId: data.recordLinkageStatusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
