import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Referrals } from '../entities';
import { createdBy } from '../../../common';

/** Datos para emitir una referencia clínica. */
export interface CreateReferralData {
  patientProfileId: string;
  sourceEncounterId?: string;
  referringProfileId?: string;
  targetProfileId?: string;
  targetTenantId?: string;
  specialtyConceptId?: string;
  serviceRequestId?: string;
  reasonConceptId?: string;
  reasonText?: string;
  priorityConceptId?: string;
  statusConceptId: string;
  validUntil?: Date;
  actorUserId?: string;
}

/** Acceso a datos de `clinical_ext.referrals`. */
@Injectable()
export class ReferralsRepository {
  findById(em: EntityManager, id: string): Promise<Referrals | null> {
    return em.findOne(Referrals, { id });
  }

  /** Detecta una referencia duplicada (mismo encuentro, destino y especialidad). */
  findDuplicate(
    em: EntityManager,
    sourceEncounterId: string,
    targetProfileId: string,
    specialtyConceptId: string,
  ): Promise<Referrals | null> {
    return em.findOne(Referrals, { sourceEncounterId, targetProfileId, specialtyConceptId });
  }

  create(em: EntityManager, data: CreateReferralData): Referrals {
    return em.create(
      Referrals,
      {
        patientProfileId: data.patientProfileId,
        sourceEncounterId: data.sourceEncounterId,
        referringProfileId: data.referringProfileId,
        targetProfileId: data.targetProfileId,
        targetTenantId: data.targetTenantId,
        specialtyConceptId: data.specialtyConceptId,
        serviceRequestId: data.serviceRequestId,
        reasonConceptId: data.reasonConceptId,
        reasonText: data.reasonText,
        priorityConceptId: data.priorityConceptId,
        statusConceptId: data.statusConceptId,
        validUntil: data.validUntil,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
