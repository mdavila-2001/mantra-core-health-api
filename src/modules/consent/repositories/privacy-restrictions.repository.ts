import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PrivacyRestrictions } from '../entities';
import { createdBy } from '../../../common';

/** Datos mínimos para materializar una restricción de privacidad. */
export interface CreatePrivacyRestrictionData {
  patientProfileId: string;
  tenantId: string;
  restrictionTypeConceptId: string;
  dataClassConceptId: string;
  targetActorTypeConceptId?: string;
  targetActorId?: string;
  reasonText?: string;
  statusConceptId: string;
  validFrom: Date;
  validTo?: Date;
  actorUserId?: string;
}

/** Acceso a datos de `consent.privacy_restrictions`. */
@Injectable()
export class PrivacyRestrictionsRepository {
  findById(em: EntityManager, id: string): Promise<PrivacyRestrictions | null> {
    return em.findOne(PrivacyRestrictions, { id });
  }

  /** Restricciones activas vinculadas a un paciente (para resolución/expiración). */
  findActiveByPatient(
    em: EntityManager,
    patientProfileId: string,
    activeStatusConceptId: string,
  ): Promise<PrivacyRestrictions[]> {
    return em.find(PrivacyRestrictions, {
      patientProfileId,
      statusConceptId: activeStatusConceptId,
    });
  }

  /** Restricciones activas cuyo `valid_to` ya venció (barrido). */
  findExpirable(
    em: EntityManager,
    activeStatusConceptId: string,
    now: Date,
  ): Promise<PrivacyRestrictions[]> {
    return em.find(PrivacyRestrictions, {
      statusConceptId: activeStatusConceptId,
      validTo: { $ne: null, $lte: now },
    });
  }

  create(em: EntityManager, data: CreatePrivacyRestrictionData): PrivacyRestrictions {
    return em.create(
      PrivacyRestrictions,
      {
        patientProfileId: data.patientProfileId,
        tenantId: data.tenantId,
        restrictionTypeConceptId: data.restrictionTypeConceptId,
        dataClassConceptId: data.dataClassConceptId,
        targetActorTypeConceptId: data.targetActorTypeConceptId,
        targetActorId: data.targetActorId,
        reasonText: data.reasonText,
        statusConceptId: data.statusConceptId,
        validFrom: data.validFrom,
        validTo: data.validTo,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
