import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { WebhookSubscriptions } from '../entities';
import { createdBy } from '../../../common';

/** Datos para crear/actualizar una suscripción de webhook (UC-12-11). */
export interface CreateWebhookData {
  /**
   * Identificador asociado a provider.
   */
  providerId: string;
  /**
   * Valor de event type mantenido por la instancia.
   */
  eventType: string;
  /**
   * Valor de callback url mantenido por la instancia.
   */
  callbackUrl: string;
  /**
   * Identificador asociado a state concept.
   */
  stateConceptId: string;
  /**
   * Identificador asociado a tenant.
   */
  tenantId?: string;
  /**
   * Valor de secret ref mantenido por la instancia.
   */
  secretRef?: string;
  /**
   * Identificador asociado a actor user.
   */
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

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `WebhookSubscriptions`.
   */
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
