import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { TrackingConsents } from '../entities';

/** Datos de una decisión de consentimiento de tracking (UC-28-05/12, append-only). */
export interface CreateTrackingConsentData {
  /**
   * Identificador asociado a user.
   */
  userId: string;
  /**
   * Identificador asociado a purpose definition.
   */
  purposeDefinitionId: string;
  /**
   * Identificador asociado a decision concept.
   */
  decisionConceptId: string;
  /**
   * Identificador asociado a jurisdiction concept.
   */
  jurisdictionConceptId?: string;
  /**
   * Valor de consent version mantenido por la instancia.
   */
  consentVersion?: string;
  /**
   * Valor de granted at mantenido por la instancia.
   */
  grantedAt?: Date;
  /**
   * Valor de withdrawn at mantenido por la instancia.
   */
  withdrawnAt?: Date;
  /**
   * Valor de evidence hash mantenido por la instancia.
   */
  evidenceHash?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a `telemetry.tracking_consents` (append-only por decisión). */
@Injectable()
export class TrackingConsentsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<TrackingConsents | null>`.
   */
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

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `TrackingConsents`.
   */
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
