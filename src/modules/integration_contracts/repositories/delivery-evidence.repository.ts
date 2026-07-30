import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { WebhookDeliveryEvidence } from '../entities';

/** Datos para registrar evidencia de entrega de webhook (UC-31-09). */
export interface CreateDeliveryEvidenceData {
  /**
   * Identificador asociado a webhook subscription.
   */
  webhookSubscriptionId: string;
  /**
   * Identificador asociado a integration exchange record.
   */
  integrationExchangeRecordId: string;
  /**
   * Identificador asociado a outcome concept.
   */
  outcomeConceptId: string;
  /**
   * Valor de signature algorithm mantenido por la instancia.
   */
  signatureAlgorithm?: string;
  /**
   * Identificador asociado a signature verification concept.
   */
  signatureVerificationConceptId?: string;
  /**
   * Valor de delivered at mantenido por la instancia.
   */
  deliveredAt?: Date;
  /**
   * Valor de acknowledged at mantenido por la instancia.
   */
  acknowledgedAt?: Date;
}

/** Acceso a datos de `integration_contracts.webhook_delivery_evidence`. */
@Injectable()
export class DeliveryEvidenceRepository {
  /** Crea la entidad de evidencia en la unidad de trabajo (sin flush). */
  create(
    em: EntityManager,
    data: CreateDeliveryEvidenceData,
  ): WebhookDeliveryEvidence {
    return em.create(
      WebhookDeliveryEvidence,
      {
        webhookSubscriptionId: data.webhookSubscriptionId,
        integrationExchangeRecordId: data.integrationExchangeRecordId,
        signatureAlgorithm: data.signatureAlgorithm,
        signatureVerificationConceptId: data.signatureVerificationConceptId,
        deliveredAt: data.deliveredAt,
        acknowledgedAt: data.acknowledgedAt,
        outcomeConceptId: data.outcomeConceptId,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }
}
