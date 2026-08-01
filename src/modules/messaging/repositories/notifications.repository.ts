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

/**
 * Describe el contrato estructural de create notification request data.
 */
export interface CreateNotificationRequestData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId?: string;
  /**
   * Identificador asociado a recipient user.
   */
  recipientUserId?: string;
  /**
   * Valor de recipient address mantenido por la instancia.
   */
  recipientAddress?: string;
  /**
   * Identificador asociado a channel.
   */
  channelId: string;
  /**
   * Identificador asociado a template.
   */
  templateId?: string;
  /**
   * Identificador asociado a domain event.
   */
  domainEventId?: string;
  /**
   * Valor de payload json mantenido por la instancia.
   */
  payloadJson?: unknown;
  /**
   * Valor de debounce key mantenido por la instancia.
   */
  debounceKey?: string;
  /**
   * Valor de priority mantenido por la instancia.
   */
  priority: number;
  /**
   * Identificador asociado a category concept.
   */
  categoryConceptId?: string;
  /**
   * Valor de related resource type mantenido por la instancia.
   */
  relatedResourceType?: string;
  /**
   * Identificador asociado a related resource.
   */
  relatedResourceId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de scheduled at mantenido por la instancia.
   */
  scheduledAt?: Date;
  /**
   * Identificador asociado a consent.
   */
  consentId?: string;
  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  idempotencyKey: string;
  /**
   * Identificador asociado a recipient type concept.
   */
  recipientTypeConceptId: string;
  /**
   * Identificador asociado a recipient ref (la entidad destinataria).
   */
  recipientRefId: string;
  /**
   * Identificador asociado a source concept (qué originó la solicitud).
   */
  sourceConceptId: string;
  /**
   * Identificador asociado a authorized by user.
   */
  authorizedByUserId: string;
  /**
   * Instantánea de por qué se consideró autorizado el envío.
   */
  authorizationSnapshotJson: unknown;
  /**
   * Instantánea del contenido tal como se decidió enviarlo.
   */
  contentSnapshotJson: unknown;
  /**
   * Hash del contenido, para detectar reenvíos con contenido distinto.
   */
  contentHash: string;
  /**
   * Identificador asociado a actor user.
   */
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

  /**
   * Obtiene find channel by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find channel by id conforme al contrato `Promise<MessageChannels | null>`.
   */
  findChannelById(
    em: EntityManager,
    id: string,
  ): Promise<MessageChannels | null> {
    return em.findOne(MessageChannels, { id });
  }

  /**
   * Obtiene find template by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find template by id conforme al contrato `Promise<MessageTemplates | null>`.
   */
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

  /**
   * Crea create notification request.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create notification request conforme al contrato `NotificationRequests`.
   */
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
        // Columnas NOT NULL del contrato WORM de la solicitud: quién es el
        // destinatario, qué originó el envío, quién lo autorizó y con qué
        // contenido. Sin ellas el INSERT viola la restricción de la tabla.
        recipientTypeConceptId: data.recipientTypeConceptId,
        recipientRefId: data.recipientRefId,
        sourceConceptId: data.sourceConceptId,
        authorizedByUserId: data.authorizedByUserId,
        authorizationSnapshotJson: data.authorizationSnapshotJson,
        contentSnapshotJson: data.contentSnapshotJson,
        contentHash: data.contentHash,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find request by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find request by id conforme al contrato `Promise<NotificationRequests | null>`.
   */
  findRequestById(
    em: EntityManager,
    id: string,
  ): Promise<NotificationRequests | null> {
    return em.findOne(NotificationRequests, { id });
  }

  /**
   * Obtiene find request for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find request for update conforme al contrato `Promise<NotificationRequests | null>`.
   */
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
   * Lote de solicitudes reclamables: las que ya llegaron a su `scheduledAt` y
   * están `NOTIF_PENDING`, o quedaron `NOTIF_SENDING` de un intento que nunca
   * volvió (proceso caído a mitad de entrega) hace más de `staleSendingBefore`.
   *
   * Bloquea el lote (`PESSIMISTIC_PARTIAL_WRITE`, equivalente a
   * `FOR UPDATE SKIP LOCKED`) para que dos relays concurrentes no se lleven la
   * misma fila. El *llamador* debe, dentro de la misma transacción, dejar cada
   * fila en `NOTIF_SENDING` antes de hacer `flush` — si sólo se leyera, dos
   * ticks del worker que se solapan (el intervalo es de 5s y la llamada al
   * proveedor real puede tardar más) descubrirían la misma solicitud dos
   * veces y la enviarían dos veces al proveedor real, algo que ya no se puede
   * deshacer aunque la base quede consistente después.
   */
  findClaimableRequests(
    em: EntityManager,
    pendingStatusConceptId: string,
    sendingStatusConceptId: string,
    now: Date,
    staleSendingBefore: Date,
    limit: number,
  ): Promise<NotificationRequests[]> {
    return em.find(
      NotificationRequests,
      {
        scheduledAt: { $lte: now },
        $or: [
          { statusConceptId: pendingStatusConceptId },
          {
            statusConceptId: sendingStatusConceptId,
            updatedAt: { $lte: staleSendingBefore },
          },
        ],
      },
      {
        lockMode: LockMode.PESSIMISTIC_PARTIAL_WRITE,
        orderBy: { priority: 'ASC', scheduledAt: 'ASC' },
        limit,
      },
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

  /**
   * Obtiene find provider by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find provider by code conforme al contrato `Promise<MessagingProviders | null>`.
   */
  findProviderByCode(
    em: EntityManager,
    code: string,
  ): Promise<MessagingProviders | null> {
    return em.findOne(MessagingProviders, { code });
  }

  /**
   * Obtiene find provider by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find provider by id conforme al contrato `Promise<MessagingProviders | null>`.
   */
  findProviderById(
    em: EntityManager,
    id: string,
  ): Promise<MessagingProviders | null> {
    return em.findOne(MessagingProviders, { id });
  }

  // --- Entregas y acuses (UC-35-11, 12) ---

  /**
   * Crea create delivery.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create delivery conforme al contrato `NotificationDeliveries`.
   */
  createDelivery(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a notification request.
       */
      notificationRequestId: string;
      /**
       * Identificador asociado a provider.
       */
      providerId: string;
      /**
       * Identificador asociado a channel.
       */
      channelId: string;
      /**
       * Identificador asociado a provider channel config.
       */
      providerChannelConfigId?: string;
      /**
       * Código del adaptador que realizó el intento.
       */
      adapterCode: string;
      /**
       * Versión del adaptador que realizó el intento.
       */
      adapterVersion: string;
      /**
       * Valor de attempt number mantenido por la instancia.
       */
      attemptNumber: number;
      /**
       * Valor de provider message ref mantenido por la instancia.
       */
      providerMessageRef?: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Valor de error code mantenido por la instancia.
       */
      errorCode?: string;
      /**
       * Valor de error text mantenido por la instancia.
       */
      errorText?: string;
      /**
       * Valor de cost amount mantenido por la instancia.
       */
      costAmount?: string;
      /**
       * Identificador asociado a currency concept.
       */
      currencyConceptId?: string;
      /**
       * Valor de sent at mantenido por la instancia.
       */
      sentAt?: Date;
      /**
       * Identificador asociado a actor user.
       */
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
        // NOT NULL: qué adaptador hizo el intento. Se toma del proveedor, que es
        // quien declara su implementación y versión.
        adapterCode: data.adapterCode,
        adapterVersion: data.adapterVersion,
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

  /**
   * Ejecuta la operación count deliveries.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param notificationRequestId - Identificador de notification request.
   * @returns Resultado de count deliveries conforme al contrato `Promise<number>`.
   */
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
      /**
       * Identificador asociado a delivery.
       */
      deliveryId: string;
      /**
       * Identificador asociado a receipt type concept.
       */
      receiptTypeConceptId: string;
      /**
       * Valor de provider status mantenido por la instancia.
       */
      providerStatus?: string;
      /**
       * Valor de raw payload json mantenido por la instancia.
       */
      rawPayloadJson?: unknown;
      /**
       * Valor de occurred at mantenido por la instancia.
       */
      occurredAt?: Date;
      /**
       * Identificador asociado a recorded by user.
       */
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

  /**
   * Crea create in app notification.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create in app notification conforme al contrato `InAppNotifications`.
   */
  createInAppNotification(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a recipient user.
       */
      recipientUserId: string;
      /**
       * Identificador asociado a tenant.
       */
      tenantId?: string;
      /**
       * Identificador asociado a channel concept.
       */
      channelConceptId?: string;
      /**
       * Identificador asociado a category concept.
       */
      categoryConceptId?: string;
      /**
       * Valor de template code mantenido por la instancia.
       */
      templateCode?: string;
      /**
       * Valor de subject mantenido por la instancia.
       */
      subject?: string;
      /**
       * Valor de body text mantenido por la instancia.
       */
      bodyText?: string;
      /**
       * Valor de payload json mantenido por la instancia.
       */
      payloadJson?: unknown;
      /**
       * Valor de related resource type mantenido por la instancia.
       */
      relatedResourceType?: string;
      /**
       * Identificador asociado a related resource.
       */
      relatedResourceId?: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a notification request.
       */
      notificationRequestId?: string;
      /**
       * Identificador asociado a notification delivery.
       */
      notificationDeliveryId?: string;
      /**
       * Identificador asociado a actor user.
       */
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

  /**
   * Obtiene find in app for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find in app for update conforme al contrato `Promise<InAppNotifications | null>`.
   */
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
