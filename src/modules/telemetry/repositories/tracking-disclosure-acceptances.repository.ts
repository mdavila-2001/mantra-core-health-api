import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { TrackingDisclosureAcceptances } from '../entities';

/** Datos de una aceptación de disclosure (UC-28-04, append-only). */
export interface CreateDisclosureAcceptanceData {
  trackingDisclosureVersionId: string;
  userId: string;
  sessionId?: string;
  acceptedAt: Date;
  ipPrefixHash?: string;
  userAgentHash?: string;
  acceptanceStatusConceptId: string;
}

/** Acceso a `telemetry.tracking_disclosure_acceptances`. */
@Injectable()
export class TrackingDisclosureAcceptancesRepository {
  /** Idempotencia lógica por (user, version, session). */
  findExisting(
    em: EntityManager,
    userId: string,
    trackingDisclosureVersionId: string,
    sessionId?: string,
  ): Promise<TrackingDisclosureAcceptances | null> {
    return em.findOne(TrackingDisclosureAcceptances, {
      userId,
      trackingDisclosureVersionId,
      sessionId: sessionId ?? null,
    });
  }

  create(
    em: EntityManager,
    data: CreateDisclosureAcceptanceData,
  ): TrackingDisclosureAcceptances {
    return em.create(
      TrackingDisclosureAcceptances,
      {
        trackingDisclosureVersionId: data.trackingDisclosureVersionId,
        userId: data.userId,
        sessionId: data.sessionId,
        acceptedAt: data.acceptedAt,
        ipPrefixHash: data.ipPrefixHash,
        userAgentHash: data.userAgentHash,
        acceptanceStatusConceptId: data.acceptanceStatusConceptId,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }
}
