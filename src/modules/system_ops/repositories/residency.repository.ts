import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  CrossBorderTransferEvents,
  DataResidencyPolicies,
  TenantResidencyBindings,
} from '../entities';
import { createdBy } from '../../../common';

/**
 * Acceso a datos de residencia de datos (UC-11-06) y transferencias
 * transfronterizas (UC-11-07). Las transferencias son append-only (sin created_at).
 */
@Injectable()
export class ResidencyRepository {
  findPolicyByCode(
    em: EntityManager,
    code: string,
  ): Promise<DataResidencyPolicies | null> {
    return em.findOne(DataResidencyPolicies, { code });
  }

  findPolicyById(
    em: EntityManager,
    id: string,
  ): Promise<DataResidencyPolicies | null> {
    return em.findOne(DataResidencyPolicies, { id });
  }

  createPolicy(
    em: EntityManager,
    data: {
      code: string;
      jurisdictionConceptId: string;
      dataClassificationId: string;
      allowedStorageRegionValueSetId: string;
      allowedProcessingRegionValueSetId?: string;
      crossBorderTransferBasisConceptId?: string;
      transferImpactAssessmentRequired?: boolean;
      encryptionKeyRegionLocked?: boolean;
      statusConceptId: string;
      validFrom: Date;
      validTo?: Date;
      actorUserId?: string;
    },
  ): DataResidencyPolicies {
    const { actorUserId, ...rest } = data;
    return em.create(
      DataResidencyPolicies,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }

  createBinding(
    em: EntityManager,
    data: {
      tenantId: string;
      residencyPolicyId: string;
      primaryRegionConceptId: string;
      disasterRecoveryRegionConceptId?: string;
      effectiveFrom?: Date;
      statusConceptId: string;
      actorUserId?: string;
    },
  ): TenantResidencyBindings {
    const { actorUserId, ...rest } = data;
    return em.create(
      TenantResidencyBindings,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }

  findTransferByReference(
    em: EntityManager,
    transferReference: string,
  ): Promise<CrossBorderTransferEvents | null> {
    return em.findOne(CrossBorderTransferEvents, { transferReference });
  }

  createTransfer(
    em: EntityManager,
    data: {
      tenantId: string;
      dataCategoryConceptId: string;
      sourceRegionConceptId: string;
      destinationRegionConceptId: string;
      transferBasisConceptId: string;
      recipientTenantId?: string;
      transferReference: string;
      approvedByUserId?: string;
    },
  ): CrossBorderTransferEvents {
    return em.create(
      CrossBorderTransferEvents,
      { ...data, recordedAt: new Date() },
      { partial: true },
    );
  }
}
