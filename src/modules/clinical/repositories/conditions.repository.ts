import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Conditions } from '../entities';
import { createdBy } from '../../../common';

export interface CreateConditionData {
  custodianTenantId: string;
  patientProfileId: string;
  encounterId?: string;
  codeConceptId: string;
  categoryConceptId?: string;
  clinicalStatusConceptId?: string;
  verificationStatusConceptId?: string;
  severityConceptId?: string;
  lateralityConceptId?: string;
  onsetAt?: Date;
  recordedByUserId?: string;
  actorUserId?: string;
}

/** Acceso a datos de `clinical.conditions` (stateless). */
@Injectable()
export class ConditionsRepository {
  findById(em: EntityManager, id: string): Promise<Conditions | null> {
    return em.findOne(Conditions, { id });
  }

  /** Condición activa del paciente con el mismo código (evita duplicados). */
  findActiveByCode(
    em: EntityManager,
    custodianTenantId: string,
    patientProfileId: string,
    codeConceptId: string,
    activeStatusConceptId: string,
  ): Promise<Conditions | null> {
    return em.findOne(Conditions, {
      custodianTenantId,
      patientProfileId,
      codeConceptId,
      clinicalStatusConceptId: activeStatusConceptId,
    });
  }

  create(em: EntityManager, data: CreateConditionData): Conditions {
    return em.create(
      Conditions,
      {
        custodianTenantId: data.custodianTenantId,
        patientProfileId: data.patientProfileId,
        encounterId: data.encounterId,
        codeConceptId: data.codeConceptId,
        categoryConceptId: data.categoryConceptId,
        clinicalStatusConceptId: data.clinicalStatusConceptId,
        verificationStatusConceptId: data.verificationStatusConceptId,
        severityConceptId: data.severityConceptId,
        lateralityConceptId: data.lateralityConceptId,
        onsetAt: data.onsetAt,
        recordedByUserId: data.recordedByUserId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
