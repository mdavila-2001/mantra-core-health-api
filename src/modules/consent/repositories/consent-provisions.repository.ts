import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ConsentProvisions } from '../entities';
import { createdBy } from '../../../common';

/** Datos de una provisión granular de un consentimiento. */
export interface CreateProvisionData {
  consentId: string;
  provisionTypeConceptId: string;
  actionConceptId: string;
  dataClassConceptId?: string;
  actorTenantId?: string;
  actorUserId?: string;
  actorRoleConceptId?: string;
  purposeOfUseConceptId?: string;
  securityLabelConceptId?: string;
  validFrom?: Date;
  validTo?: Date;
  createdByUserId?: string;
}

/** Acceso a datos de `consent.consent_provisions`. */
@Injectable()
export class ConsentProvisionsRepository {
  /** Provisiones vigentes (sin `valid_to`) de un consentimiento. */
  findOpenByConsent(
    em: EntityManager,
    consentId: string,
  ): Promise<ConsentProvisions[]> {
    return em.find(ConsentProvisions, { consentId, validTo: null });
  }

  create(em: EntityManager, data: CreateProvisionData): ConsentProvisions {
    return em.create(
      ConsentProvisions,
      {
        consentId: data.consentId,
        provisionTypeConceptId: data.provisionTypeConceptId,
        actionConceptId: data.actionConceptId,
        dataClassConceptId: data.dataClassConceptId,
        actorTenantId: data.actorTenantId,
        actorUserId: data.actorUserId,
        actorRoleConceptId: data.actorRoleConceptId,
        purposeOfUseConceptId: data.purposeOfUseConceptId,
        securityLabelConceptId: data.securityLabelConceptId,
        validFrom: data.validFrom,
        validTo: data.validTo,
        ...createdBy(data.createdByUserId),
      },
      { partial: true },
    );
  }
}
