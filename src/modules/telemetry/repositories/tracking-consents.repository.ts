import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { TrackingConsents } from '../entities';

/** Datos de una decisión de consentimiento de tracking (UC-28-05/12, append-only). */
export interface CreateTrackingConsentData {
  userId: string;
  purposeDefinitionId: string;
  decisionConceptId: string;
  jurisdictionConceptId?: string;
  consentVersion?: string;
  grantedAt?: Date;
  withdrawnAt?: Date;
  evidenceHash?: string;
  actorUserId?: string;
}

/** Acceso a `telemetry.tracking_consents` (append-only por decisión). */
@Injectable()
export class TrackingConsentsRepository {
  findById(em: EntityManager, id: string): Promise<TrackingConsents | null> {
    return em.findOne(TrackingConsents, { id });
  }

  /** Última decisión efectiva por (user, purpose): define el estado actual. */
  findLatest(
    em: EntityManager,
    userId: string,
    purposeDefinitionId: string,
  ): Promise<TrackingConsents | null> {
    return em.findOne(
      TrackingConsents,
      { userId, purposeDefinitionId },
      { orderBy: { createdAt: 'DESC' } },
    );
  }

  create(em: EntityManager, data: CreateTrackingConsentData): TrackingConsents {
    return em.create(
      TrackingConsents,
      {
        userId: data.userId,
        purposeDefinitionId: data.purposeDefinitionId,
        decisionConceptId: data.decisionConceptId,
        jurisdictionConceptId: data.jurisdictionConceptId,
        consentVersion: data.consentVersion,
        grantedAt: data.grantedAt,
        withdrawnAt: data.withdrawnAt,
        evidenceHash: data.evidenceHash,
        createdAt: new Date(),
        createdByUserId: data.actorUserId,
      },
      { partial: true },
    );
  }
}
