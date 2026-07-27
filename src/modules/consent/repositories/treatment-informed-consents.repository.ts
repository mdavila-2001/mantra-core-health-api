import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { TreatmentInformedConsents } from '../entities';
import { createdBy } from '../../../common';

/** Datos mínimos para capturar un consentimiento informado de tratamiento. */
export interface CreateTreatmentInformedConsentData {
  patientProfileId: string;
  tenantId: string;
  encounterId: string;
  procedureCodeConceptId?: string;
  informationVersion?: string;
  interpreterUserId?: string;
  witnessUserId?: string;
  decisionConceptId: string;
  statusConceptId: string;
  signedAt: Date;
  actorUserId?: string;
}

/** Acceso a datos de `consent.treatment_informed_consents` (entidad versionada). */
@Injectable()
export class TreatmentInformedConsentsRepository {
  findById(
    em: EntityManager,
    id: string,
  ): Promise<TreatmentInformedConsents | null> {
    return em.findOne(TreatmentInformedConsents, { id });
  }

  create(
    em: EntityManager,
    data: CreateTreatmentInformedConsentData,
  ): TreatmentInformedConsents {
    return em.create(
      TreatmentInformedConsents,
      {
        patientProfileId: data.patientProfileId,
        tenantId: data.tenantId,
        encounterId: data.encounterId,
        procedureCodeConceptId: data.procedureCodeConceptId,
        informationVersion: data.informationVersion,
        interpreterUserId: data.interpreterUserId,
        witnessUserId: data.witnessUserId,
        decisionConceptId: data.decisionConceptId,
        statusConceptId: data.statusConceptId,
        signedAt: data.signedAt,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
