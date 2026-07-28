import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PatientProfiles } from '../entities';
import { createdBy } from '../../../common';

/** Datos del perfil de paciente (PK = person_profiles.id, 1:1). */
export interface CreatePatientProfileData {
  /**
   * Identificador asociado a profile.
   */
  profileId: string;
  /**
   * Valor de patient code mantenido por la instancia.
   */
  patientCode: string;
  /**
   * Valor de master patient index code mantenido por la instancia.
   */
  masterPatientIndexCode?: string;
  /**
   * Identificador asociado a record linkage status concept.
   */
  recordLinkageStatusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `profiles.patient_profiles`. */
@Injectable()
export class PatientProfilesRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param profileId - Identificador de profile.
   * @returns Resultado de find by id conforme al contrato `Promise<PatientProfiles | null>`.
   */
  findById(
    em: EntityManager,
    profileId: string,
  ): Promise<PatientProfiles | null> {
    return em.findOne(PatientProfiles, { profileId });
  }

  /** Verifica unicidad de patient_code (uq_patient_profiles_patient_code). */
  findByPatientCode(
    em: EntityManager,
    patientCode: string,
  ): Promise<PatientProfiles | null> {
    return em.findOne(PatientProfiles, { patientCode });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `PatientProfiles`.
   */
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
