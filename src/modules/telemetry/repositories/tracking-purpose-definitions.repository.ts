import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { TrackingPurposeDefinitions } from '../entities';

/** Datos de alta de un propósito de tracking (UC-28-01). */
export interface CreateTrackingPurposeData {
  purposeCode: string;
  name: string;
  purposeCategoryConceptId: string;
  legalBasisConceptId?: string;
  requiresConsent?: boolean;
  permitsMarketingUse?: boolean;
  permitsCrossTenantAggregation?: boolean;
  defaultRetentionDays?: number;
  versionNumber: number;
  effectiveFrom: Date;
  statusConceptId: string;
  actorUserId?: string;
}

/** Acceso a `telemetry.tracking_purpose_definitions`. Stateless: recibe el `em`. */
@Injectable()
export class TrackingPurposeDefinitionsRepository {
  findById(
    em: EntityManager,
    id: string,
  ): Promise<TrackingPurposeDefinitions | null> {
    return em.findOne(TrackingPurposeDefinitions, { id });
  }

  findByCode(
    em: EntityManager,
    purposeCode: string,
  ): Promise<TrackingPurposeDefinitions | null> {
    return em.findOne(TrackingPurposeDefinitions, { purposeCode });
  }

  create(
    em: EntityManager,
    data: CreateTrackingPurposeData,
  ): TrackingPurposeDefinitions {
    return em.create(
      TrackingPurposeDefinitions,
      {
        purposeCode: data.purposeCode,
        name: data.name,
        purposeCategoryConceptId: data.purposeCategoryConceptId,
        legalBasisConceptId: data.legalBasisConceptId,
        requiresConsent: data.requiresConsent,
        permitsMarketingUse: data.permitsMarketingUse,
        permitsCrossTenantAggregation: data.permitsCrossTenantAggregation,
        defaultRetentionDays: data.defaultRetentionDays,
        versionNumber: data.versionNumber,
        effectiveFrom: data.effectiveFrom,
        statusConceptId: data.statusConceptId,
        createdAt: new Date(),
        createdByUserId: data.actorUserId,
      },
      { partial: true },
    );
  }
}
