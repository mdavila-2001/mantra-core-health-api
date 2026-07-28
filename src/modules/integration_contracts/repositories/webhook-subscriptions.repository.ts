import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ContractWebhookSubscriptions } from '../entities';
import { createdBy } from '../../../common';

/** Datos para suscribir un webhook a un contrato (UC-31-04). */
export interface CreateWebhookSubscriptionData {
  /**
   * Identificador asociado a integration contract.
   */
  integrationContractId: string;
  /**
   * Identificador asociado a event type concept.
   */
  eventTypeConceptId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de callback uri mantenido por la instancia.
   */
  callbackUri?: string;
  /**
   * Valor de signing key reference mantenido por la instancia.
   */
  signingKeyReference?: string;
  /**
   * Valor de secret reference mantenido por la instancia.
   */
  secretReference?: string;
  /**
   * Valor de valid from mantenido por la instancia.
   */
  validFrom?: Date;
  /**
   * Valor de valid to mantenido por la instancia.
   */
  validTo?: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `integration_contracts.contract_webhook_subscriptions`. */
@Injectable()
export class WebhookSubscriptionsRepository {
  /** Busca una suscripción por id; `null` si no existe. */
  findById(
    em: EntityManager,
    id: string,
  ): Promise<ContractWebhookSubscriptions | null> {
    return em.findOne(ContractWebhookSubscriptions, { id });
  }

  /** Detecta una suscripción duplicada (contrato, tipo de evento, callback). */
  findDuplicate(
    em: EntityManager,
    contractId: string,
    eventTypeConceptId: string,
    callbackUri?: string,
  ): Promise<ContractWebhookSubscriptions | null> {
    return em.findOne(ContractWebhookSubscriptions, {
      integrationContractId: contractId,
      eventTypeConceptId,
      callbackUri: callbackUri ?? null,
    });
  }

  /** Suscripciones activas del contrato (para suspender en el retiro). */
  findActiveByContract(
    em: EntityManager,
    contractId: string,
    activeStatusConceptId: string,
  ): Promise<ContractWebhookSubscriptions[]> {
    return em.find(ContractWebhookSubscriptions, {
      integrationContractId: contractId,
      statusConceptId: activeStatusConceptId,
    });
  }

  /** Crea la entidad de suscripción en la unidad de trabajo (sin flush). */
  create(
    em: EntityManager,
    data: CreateWebhookSubscriptionData,
  ): ContractWebhookSubscriptions {
    return em.create(
      ContractWebhookSubscriptions,
      {
        integrationContractId: data.integrationContractId,
        eventTypeConceptId: data.eventTypeConceptId,
        callbackUri: data.callbackUri,
        signingKeyReference: data.signingKeyReference,
        secretReference: data.secretReference,
        validFrom: data.validFrom,
        validTo: data.validTo,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
