import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ClinicalAccessGrants } from '../entities';
import { CONCEPTS, createdBy } from '../../../common';

/** Datos de un acceso clínico con propósito de uso. */
export interface CreateClinicalAccessGrantData {
  patientProfileId: string;
  grantedUserId: string;
  tenantId: string;
  branchId?: string;
  encounterId?: string;
  consentId?: string;
  reasonConceptId: string;
  accessLevelConceptId: string;
  validFrom: Date;
  validTo: Date;
  actorUserId?: string;
}

/** Acceso a datos de `authz.clinical_access_grants`. */
@Injectable()
export class ClinicalAccessGrantsRepository {
  findById(em: EntityManager, id: string): Promise<ClinicalAccessGrants | null> {
    return em.findOne(ClinicalAccessGrants, { id });
  }

  /** Grant activo concreto (paciente, usuario) si existe (evita duplicados). */
  findActive(
    em: EntityManager,
    patientProfileId: string,
    grantedUserId: string,
  ): Promise<ClinicalAccessGrants | null> {
    return em.findOne(ClinicalAccessGrants, {
      patientProfileId,
      grantedUserId,
      stateConceptId: CONCEPTS.STATE_ACTIVE,
    });
  }

  /** Grants activos de un usuario sobre un paciente (para el PDP). */
  findActiveForUserPatient(
    em: EntityManager,
    grantedUserId: string,
    patientProfileId: string,
  ): Promise<ClinicalAccessGrants[]> {
    return em.find(ClinicalAccessGrants, {
      grantedUserId,
      patientProfileId,
      stateConceptId: CONCEPTS.STATE_ACTIVE,
    });
  }

  create(em: EntityManager, data: CreateClinicalAccessGrantData): ClinicalAccessGrants {
    return em.create(
      ClinicalAccessGrants,
      {
        patientProfileId: data.patientProfileId,
        grantedUserId: data.grantedUserId,
        tenantId: data.tenantId,
        branchId: data.branchId,
        encounterId: data.encounterId,
        consentId: data.consentId,
        reasonConceptId: data.reasonConceptId,
        accessLevelConceptId: data.accessLevelConceptId,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        validFrom: data.validFrom,
        validTo: data.validTo,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
