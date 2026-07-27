import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  MessageChannels,
  MessageTemplates,
  RecipientPreferences,
  NotificationRequests,
  ProviderChannelConfigs,
  MessagingProviders,
  NotificationDeliveries,
  DeliveryReceipts,
  InAppNotifications,
} from '../entities';
import { createdBy } from '../../../common';

export interface CreateNotificationRequestData {
  tenantId?: string;
  recipientUserId?: string;
  recipientAddress?: string;
  channelId: string;
  templateId?: string;
  domainEventId?: string;
  payloadJson?: unknown;
  debounceKey?: string;
  priority: number;
  categoryConceptId?: string;
  relatedResourceType?: string;
  relatedResourceId?: string;
  statusConceptId: string;
  scheduledAt?: Date;
  consentId?: string;
  idempotencyKey?: string;
  actorUserId?: string;
}

/**
 * Acceso a las notificaciones de `messaging.*`: canales, plantillas,
 * preferencias del destinatario, solicitudes, configuraciones de proveedor,
 * entregas, acuses y bandeja in-app.
 */
@Injectable()
export class NotificationsRepository {
  // --- Catálogo (UC-35-10) ---

  findChannelById(
    em: EntityManager,
    id: string,
  ): Promise<MessageChannels | null> {
    return em.findOne(MessageChannels, { id });
  }

  findTemplateById(
    em: EntityManager,
    id: string,
  ): Promise<MessageTemplates | null> {
    return em.findOne(MessageTemplates, { id });
  }

  /** Preferencia del destinatario para ese canal y esa categoría. */
  findPreference(
    em: EntityManager,
    userId: string,
    channelId: string,
    categoryConceptId?: string,
  ): Promise<RecipientPreferences | null> {
    return em.findOne(RecipientPreferences, {
      userId,
      channelId,
      categoryConceptId,
    });
  }

  // --- Solicitudes (UC-35-10, 11, 12) ---

  createNotificationRequest(
    em: EntityManager,
    data: CreateNotificationRequestData,
  ): NotificationRequests {
    return em.create(
      NotificationRequests,
      {
        tenantId: data.tenantId,
        recipientUserId: data.recipientUserId,
        recipientAddress: data.recipientAddress,
        channelId: data.channelId,
        templateId: data.templateId,
        domainEventId: data.domainEventId,
        payloadJson: data.payloadJson,
        debounceKey: data.debounceKey,
        priority: data.priority,
        categoryConceptId: data.categoryConceptId,
        relatedResourceType: data.relatedResourceType,
        relatedResourceId: data.relatedResourceId,
        statusConceptId: data.statusConceptId,
        scheduledAt: data.scheduledAt,
        consentId: data.consentId,
        idempotencyKey: data.idempotencyKey,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findRequestById(
    em: EntityManager,
    id: string,
  ): Promise<NotificationRequests | null> {
    return em.findOne(NotificationRequests, { id });
  }

  findRequestForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<NotificationRequests | null> {
    return em.findOne(
      NotificationRequests,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Solicitud viva con la misma clave de rebote: colapsa las notificaciones
   * repetidas sin perder la que ya está registrada.
   */
  findLiveRequestByDebounceKey(
    em: EntityManager,
    debounceKey: string,
    liveStatusConceptIds: string[],
  ): Promise<NotificationRequests | null> {
    return em.findOne(NotificationRequests, {
      debounceKey,
      statusConceptId: { $in: liveStatusConceptIds },
    });
  }

  // --- Proveedores (UC-35-11, 12) ---

  /**
   * Configuraciones activas del canal, por prioridad: la primera es la que se
   * usa, y las siguientes son el plan B.
   */
  findChannelConfigs(
    em: EntityManager,
    channelId: string,
    activeStateConceptId: string,
  ): Promise<ProviderChannelConfigs[]> {
    return em.find(
      ProviderChannelConfigs,
      { channelId, stateConceptId: activeStateConceptId },
      { orderBy: { priority: 'ASC' } },
    );
  }

  findProviderByCode(
    em: EntityManager,
    code: string,
  ): Promise<MessagingProviders | null> {
    return em.findOne(MessagingProviders, { code });
  }

  // --- Entregas y acuses (UC-35-11, 12) ---

  createDelivery(
    em: EntityManager,
    data: {
      notificationRequestId: string;
      providerId: string;
      channelId: string;
      providerChannelConfigId?: string;
      attemptNumber: number;
      providerMessageRef?: string;
      statusConceptId: string;
      errorCode?: string;
      errorText?: string;
      costAmount?: string;
      currencyConceptId?: string;
      sentAt?: Date;
      actorUserId?: string;
    },
  ): NotificationDeliveries {
    return em.create(
      NotificationDeliveries,
      {
        notificationRequestId: data.notificationRequestId,
        providerId: data.providerId,
        channelId: data.channelId,
        providerChannelConfigId: data.providerChannelConfigId,
        attemptNumber: data.attemptNumber,
        providerMessageRef: data.providerMessageRef,
        statusConceptId: data.statusConceptId,
        errorCode: data.errorCode,
        errorText: data.errorText,
        costAmount: data.costAmount,
        currencyConceptId: data.currencyConceptId,
        sentAt: data.sentAt,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Intento ya registrado: hace idempotente el reintento del worker. */
  findDeliveryByAttempt(
    em: EntityManager,
    notificationRequestId: string,
    attemptNumber: number,
  ): Promise<NotificationDeliveries | null> {
    return em.findOne(NotificationDeliveries, {
      notificationRequestId,
      attemptNumber,
    });
  }

  countDeliveries(
    em: EntityManager,
    notificationRequestId: string,
  ): Promise<number> {
    return em.count(NotificationDeliveries, { notificationRequestId });
  }

  /** El webhook del proveedor identifica la entrega por su referencia de mensaje. */
  findDeliveryByProviderRefForUpdate(
    em: EntityManager,
    providerId: string,
    providerMessageRef: string,
  ): Promise<NotificationDeliveries | null> {
    return em.findOne(
      NotificationDeliveries,
      { providerId, providerMessageRef },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** Log append-only: el acuse del proveedor queda tal como llegó. */
  createReceipt(
    em: EntityManager,
    data: {
      deliveryId: string;
      receiptTypeConceptId: string;
      providerStatus?: string;
      rawPayloadJson?: unknown;
      occurredAt?: Date;
      recordedByUserId?: string;
    },
  ): DeliveryReceipts {
    return em.create(
      DeliveryReceipts,
      {
        deliveryId: data.deliveryId,
        receiptTypeConceptId: data.receiptTypeConceptId,
        providerStatus: data.providerStatus,
        rawPayloadJson: data.rawPayloadJson,
        occurredAt: data.occurredAt ?? new Date(),
        recordedAt: new Date(),
        recordedByUserId: data.recordedByUserId,
      },
      { partial: true },
    );
  }

  /** Mismo acuse ya procesado: el proveedor reentrega y no debe contarse dos veces. */
  findReceipt(
    em: EntityManager,
    deliveryId: string,
    receiptTypeConceptId: string,
  ): Promise<DeliveryReceipts | null> {
    return em.findOne(DeliveryReceipts, { deliveryId, receiptTypeConceptId });
  }

  // --- Bandeja in-app (UC-35-11, 13) ---

  createInAppNotification(
    em: EntityManager,
    data: {
      recipientUserId: string;
      tenantId?: string;
      channelConceptId?: string;
      categoryConceptId?: string;
      templateCode?: string;
      subject?: string;
      bodyText?: string;
      payloadJson?: unknown;
      relatedResourceType?: string;
      relatedResourceId?: string;
      statusConceptId: string;
      notificationRequestId?: string;
      notificationDeliveryId?: string;
      actorUserId?: string;
    },
  ): InAppNotifications {
    return em.create(
      InAppNotifications,
      {
        recipientUserId: data.recipientUserId,
        tenantId: data.tenantId,
        channelConceptId: data.channelConceptId,
        categoryConceptId: data.categoryConceptId,
        templateCode: data.templateCode,
        subject: data.subject,
        bodyText: data.bodyText,
        payloadJson: data.payloadJson,
        relatedResourceType: data.relatedResourceType,
        relatedResourceId: data.relatedResourceId,
        statusConceptId: data.statusConceptId,
        notificationRequestId: data.notificationRequestId,
        notificationDeliveryId: data.notificationDeliveryId,
        sentAt: new Date(),
        availableAt: new Date(),
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findInAppForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<InAppNotifications | null> {
    return em.findOne(
      InAppNotifications,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }
}
