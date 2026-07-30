import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { TrackingDisclosureAcceptances } from '../entities';

/** Datos de una aceptación de disclosure (UC-28-04, append-only). */
export interface CreateDisclosureAcceptanceData {
  /**
   * Identificador asociado a tracking disclosure version.
   */
  trackingDisclosureVersionId: string;
  /**
   * Identificador asociado a user.
   */
  userId: string;
  /**
   * Identificador asociado a session.
   */
  sessionId?: string;
  /**
   * Valor de accepted at mantenido por la instancia.
   */
  acceptedAt: Date;
  /**
   * Valor de ip prefix hash mantenido por la instancia.
   */
  ipPrefixHash?: string;
  /**
   * Valor de user agent hash mantenido por la instancia.
   */
  userAgentHash?: string;
  /**
   * Identificador asociado a acceptance status concept.
   */
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

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `TrackingDisclosureAcceptances`.
   */
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
