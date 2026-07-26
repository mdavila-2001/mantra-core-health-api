import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { WebhookSubscriptions } from '../entities';
import { createdBy } from '../../../common';

/** Datos para crear/actualizar una suscripción de webhook (UC-12-11). */
export interface CreateWebhookData {
  providerId: string;
  eventType: string;
  callbackUrl: string;
  stateConceptId: string;
  tenantId?: string;
  secretRef?: string;
  actorUserId?: string;
}

/** Acceso a datos de `integrations.webhook_subscriptions`. */
@Injectable()
export class WebhookSubscriptionsRepository {
  /**
   * Suscripción existente para la clave lógica (tenant_id, provider_id,
   * event_type); evita duplicados y permite el UPSERT del caso de uso.
   */
  findByLogicalKey(
    em: EntityManager,
    providerId: string,
    eventType: string,
    tenantId?: string,
  ): Promise<WebhookSubscriptions | null> {
    return em.findOne(WebhookSubscriptions, {
      providerId,
      eventType,
      tenantId: tenantId ?? null,
    });
  }

  create(em: EntityManager, data: CreateWebhookData): WebhookSubscriptions {
    return em.create(
      WebhookSubscriptions,
      {
        providerId: data.providerId,
        eventType: data.eventType,
        callbackUrl: data.callbackUrl,
        stateConceptId: data.stateConceptId,
        tenantId: data.tenantId,
        secretRef: data.secretRef,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
