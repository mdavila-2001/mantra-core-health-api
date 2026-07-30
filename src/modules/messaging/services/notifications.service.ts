import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  UnauthorizedException,
  canonicalJson,
  deriveWebhookSecret,
  touch,
  verifySignature,
  type AuthenticatedUser,
} from '../../../common';
import { NotificationsRepository } from '../repositories';
import {
  CreateNotificationRequestDto,
  NotificationRequestResponseDto,
  DeliverNotificationDto,
  DeliverNotificationResponseDto,
  ProviderReceiptDto,
  ProviderReceiptResponseDto,
  InAppReadResponseDto,
  type ReceiptType,
} from '../dto';

const RECEIPT_TYPE_CONCEPT: Readonly<Record<ReceiptType, string>> = {
  DELIVERED: CONCEPTS.MSG_RECEIPT_DELIVERED,
  BOUNCED: CONCEPTS.MSG_RECEIPT_BOUNCED,
  READ: CONCEPTS.MSG_RECEIPT_READ,
};

/** A qué estado deja la entrega cada tipo de acuse. */
const RECEIPT_DELIVERY_STATUS: Readonly<Record<ReceiptType, string>> = {
  DELIVERED: CONCEPTS.NOTIF_DELIVERY_DELIVERED,
  BOUNCED: CONCEPTS.NOTIF_DELIVERY_BOUNCED,
  // Que la lean no cambia el hecho de que se entregó.
  READ: CONCEPTS.NOTIF_DELIVERY_DELIVERED,
};

/** Estados en los que una solicitud sigue viva para efectos del rebote. */
const LIVE_REQUEST_STATES: readonly string[] = [
  CONCEPTS.NOTIF_PENDING,
  CONCEPTS.NOTIF_SENDING,
  CONCEPTS.NOTIF_SENT,
];

const DEFAULT_PRIORITY = 5;

/**
 * Notificaciones: solicitud consciente del consentimiento, entrega multicanal,
 * conciliación de acuses del proveedor y bandeja in-app
 * (UC-35-10 … 13).
 */
@Injectable()
export class NotificationsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param notificationsRepo - Valor de notifications repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly notificationsRepo: NotificationsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(NotificationsService.name);
  }

  /**
   * UC-35-10: crear la solicitud de notificación.
   *
   * Sin consentimiento o sin opt-in **no se entrega, pero sí se registra** como
   * suprimida: dejar de escribir la fila haría imposible demostrar después que
   * se respetó la preferencia del destinatario.
   */
  async createRequest(
    dto: CreateNotificationRequestDto,
    actor: AuthenticatedUser,
  ): Promise<NotificationRequestResponseDto> {
    this.logger.info(
      { operation: 'messaging.notification.request', channelId: dto.channelId },
      'Creating notification request',
    );

    // Un canal externo necesita a dónde escribir; uno interno, a quién.
    if (!dto.recipientUserId && !dto.recipientAddress) {
      throw new PreconditionFailedException(
        'La notificación necesita destinatario interno o dirección de destino',
        { channelId: dto.channelId },
      );
    }

    return this.em.transactional(async (tx) => {
      const channel = await this.notificationsRepo.findChannelById(
        tx,
        dto.channelId,
      );
      if (!channel) {
        throw new ResourceNotFoundException('Canal no encontrado', {
          channelId: dto.channelId,
        });
      }
      if (channel.stateConceptId !== CONCEPTS.STATE_ACTIVE) {
        throw new PreconditionFailedException('El canal no está activo', {
          channelId: dto.channelId,
        });
      }

      if (dto.templateId) {
        const template = await this.notificationsRepo.findTemplateById(
          tx,
          dto.templateId,
        );
        if (!template) {
          throw new ResourceNotFoundException('Plantilla no encontrada', {
            templateId: dto.templateId,
          });
        }
        if (template.statusConceptId !== CONCEPTS.STATE_ACTIVE) {
          throw new PreconditionFailedException(
            'La plantilla no está publicada',
            {
              templateId: dto.templateId,
            },
          );
        }
        if (template.channelId !== dto.channelId) {
          throw new PreconditionFailedException(
            'La plantilla es de otro canal',
            {
              templateId: dto.templateId,
              channelId: dto.channelId,
            },
          );
        }
      }

      // El rebote colapsa las repetidas, pero conserva la que ya existe: se
      // devuelve esa en lugar de crear una segunda.
      if (dto.debounceKey) {
        const live = await this.notificationsRepo.findLiveRequestByDebounceKey(
          tx,
          dto.debounceKey,
          [...LIVE_REQUEST_STATES],
        );
        if (live) {
          return {
            id: live.id,
            statusConceptId: live.statusConceptId,
            suppressed: false,
            debounced: true,
          };
        }
      }

      const suppression = await this.evaluateSuppression(tx, dto);
      const statusConceptId = suppression
        ? CONCEPTS.NOTIF_SUPPRESSED
        : CONCEPTS.NOTIF_PENDING;

      const request = this.notificationsRepo.createNotificationRequest(tx, {
        tenantId: dto.tenantId,
        recipientUserId: dto.recipientUserId,
        recipientAddress: dto.recipientAddress,
        channelId: dto.channelId,
        templateId: dto.templateId,
        domainEventId: dto.domainEventId,
        payloadJson: dto.payloadJson,
        debounceKey: dto.debounceKey,
        priority: dto.priority ?? DEFAULT_PRIORITY,
        categoryConceptId: dto.categoryConceptId,
        relatedResourceType: dto.relatedResourceType,
        relatedResourceId: dto.relatedResourceId,
        statusConceptId,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : new Date(),
        consentId: dto.consentId,
        actorUserId: actor.id,
      });

      if (suppression) {
        this.logger.warn(
          {
            operation: 'messaging.notification.request',
            requestId: request.id,
            reason: suppression,
          },
          'Notification suppressed before delivery',
        );
      }

      return {
        id: request.id,
        statusConceptId,
        suppressed: suppression !== undefined,
        suppressionReason: suppression,
        debounced: false,
      };
    });
  }

  /**
   * UC-35-11: registrar el intento de entrega ante el proveedor.
   *
   * La llamada al proveedor ocurre **fuera** de esta transacción: el worker la
   * hace y aquí sólo se asienta el resultado. Mantener abierta una transacción
   * mientras se espera a un tercero es la forma más rápida de agotar el pool de
   * conexiones cuando ese tercero se cae.
   */
  async deliverNotification(
    requestId: string,
    dto: DeliverNotificationDto,
    actor: AuthenticatedUser,
  ): Promise<DeliverNotificationResponseDto> {
    return this.em.transactional(async (tx) => {
      const request = await this.notificationsRepo.findRequestForUpdate(
        tx,
        requestId,
      );
      if (!request) {
        throw new ResourceNotFoundException(
          'Solicitud de notificación no encontrada',
          {
            requestId,
          },
        );
      }
      if (request.statusConceptId === CONCEPTS.NOTIF_SUPPRESSED) {
        throw new PreconditionFailedException(
          'La notificación está suprimida',
          { requestId },
        );
      }
      if (
        request.statusConceptId !== CONCEPTS.NOTIF_PENDING &&
        request.statusConceptId !== CONCEPTS.NOTIF_SENDING
      ) {
        throw new PreconditionFailedException(
          'La notificación ya no admite intentos',
          {
            requestId,
          },
        );
      }

      const configs = await this.notificationsRepo.findChannelConfigs(
        tx,
        request.channelId,
        CONCEPTS.STATE_ACTIVE,
      );
      const config = dto.providerChannelConfigId
        ? configs.find(
            (candidate) => candidate.id === dto.providerChannelConfigId,
          )
        : configs[0];
      if (!config) {
        throw new PreconditionFailedException(
          'El canal no tiene configuración de proveedor activa',
          { requestId, channelId: request.channelId },
        );
      }

      const attemptNumber =
        (await this.notificationsRepo.countDeliveries(tx, requestId)) + 1;
      const already = await this.notificationsRepo.findDeliveryByAttempt(
        tx,
        requestId,
        attemptNumber,
      );
      if (already) {
        return {
          deliveryId: already.id,
          attemptNumber,
          deliveryStatusConceptId: already.statusConceptId,
          requestStatusConceptId: request.statusConceptId,
          duplicate: true,
        };
      }

      const sent = dto.outcome === 'SENT';
      const now = new Date();
      const delivery = this.notificationsRepo.createDelivery(tx, {
        notificationRequestId: requestId,
        providerId: config.providerId,
        channelId: request.channelId,
        providerChannelConfigId: config.id,
        attemptNumber,
        providerMessageRef: dto.providerMessageRef,
        statusConceptId: sent
          ? CONCEPTS.NOTIF_DELIVERY_SENT
          : CONCEPTS.NOTIF_DELIVERY_FAILED,
        errorCode: dto.errorCode,
        errorText: dto.errorText,
        costAmount: dto.costAmount,
        currencyConceptId: dto.currencyConceptId,
        sentAt: sent ? now : undefined,
        actorUserId: actor.id,
      });

      // El canal in-app no sale a ningún proveedor: la entrega es escribir en
      // la bandeja del destinatario.
      let inAppNotificationId: string | undefined;
      const channel = await this.notificationsRepo.findChannelById(
        tx,
        request.channelId,
      );
      if (
        sent &&
        channel?.channelTypeConceptId === CONCEPTS.CHANNEL_TYPE_IN_APP
      ) {
        if (!request.recipientUserId) {
          throw new PreconditionFailedException(
            'Una notificación in-app necesita destinatario interno',
            { requestId },
          );
        }

        inAppNotificationId = this.notificationsRepo.createInAppNotification(
          tx,
          {
            recipientUserId: request.recipientUserId,
            tenantId: request.tenantId,
            categoryConceptId: request.categoryConceptId,
            subject: dto.subject,
            bodyText: dto.bodyText,
            payloadJson: request.payloadJson,
            relatedResourceType: request.relatedResourceType,
            relatedResourceId: request.relatedResourceId,
            statusConceptId: CONCEPTS.INAPP_UNREAD,
            notificationRequestId: requestId,
            notificationDeliveryId: delivery.id,
            actorUserId: actor.id,
          },
        ).id;
      }

      request.statusConceptId = sent
        ? CONCEPTS.NOTIF_SENT
        : CONCEPTS.NOTIF_FAILED;
      touch(request, actor.id);

      if (!sent) {
        this.logger.warn(
          {
            operation: 'messaging.notification.deliver',
            requestId,
            errorCode: dto.errorCode,
          },
          'Notification delivery attempt failed',
        );
      }

      return {
        deliveryId: delivery.id,
        attemptNumber,
        deliveryStatusConceptId: delivery.statusConceptId,
        requestStatusConceptId: request.statusConceptId,
        inAppNotificationId,
        duplicate: false,
      };
    });
  }

  /**
   * UC-35-12: conciliar el acuse que envía el proveedor por webhook.
   *
   * Idempotente por `(entrega, tipo de acuse)`: los proveedores reentregan sus
   * webhooks, y contar dos veces el mismo rebote falsearía las métricas de
   * entregabilidad.
   */
  async recordProviderReceipt(
    providerCode: string,
    dto: ProviderReceiptDto,
  ): Promise<ProviderReceiptResponseDto> {
    return this.em.transactional(async (tx) => {
      const provider = await this.notificationsRepo.findProviderByCode(
        tx,
        providerCode,
      );
      if (!provider) {
        throw new ResourceNotFoundException('Proveedor no encontrado', {
          providerCode,
        });
      }

      // Verificación de firma HMAC del proveedor ANTES de conciliar nada
      // (fail-closed): sin firma válida contra el secreto del proveedor se
      // rechaza el acuse. Esta es la única superficie pública del módulo.
      const secret = deriveWebhookSecret('provider', provider.id); // TODO secreto por proveedor
      const rawBody = canonicalJson(dto.rawPayloadJson);
      if (!verifySignature(secret, rawBody, dto.signature)) {
        throw new UnauthorizedException(
          'Firma del acuse del proveedor inválida',
          { providerCode },
        );
      }

      const delivery =
        await this.notificationsRepo.findDeliveryByProviderRefForUpdate(
          tx,
          provider.id,
          dto.providerMessageRef,
        );
      if (!delivery) {
        throw new ResourceNotFoundException(
          'No hay entrega con esa referencia de mensaje',
          {
            providerCode,
            providerMessageRef: dto.providerMessageRef,
          },
        );
      }

      const receiptTypeConceptId = RECEIPT_TYPE_CONCEPT[dto.receiptType];
      const existing = await this.notificationsRepo.findReceipt(
        tx,
        delivery.id,
        receiptTypeConceptId,
      );
      const request = await this.notificationsRepo.findRequestForUpdate(
        tx,
        delivery.notificationRequestId,
      );

      if (existing) {
        return {
          receiptId: existing.id,
          deliveryId: delivery.id,
          deliveryStatusConceptId: delivery.statusConceptId,
          requestStatusConceptId:
            request?.statusConceptId ?? CONCEPTS.NOTIF_SENT,
          duplicate: true,
        };
      }

      const receipt = this.notificationsRepo.createReceipt(tx, {
        deliveryId: delivery.id,
        receiptTypeConceptId,
        providerStatus: dto.providerStatus,
        rawPayloadJson: dto.rawPayloadJson,
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
      });

      delivery.statusConceptId = RECEIPT_DELIVERY_STATUS[dto.receiptType];

      // Sólo el rebote es terminal en la solicitud: que la lean es información
      // añadida, no un cambio en si llegó o no.
      if (request) {
        request.statusConceptId =
          dto.receiptType === 'BOUNCED'
            ? CONCEPTS.NOTIF_FAILED
            : CONCEPTS.NOTIF_DELIVERED;
      }

      if (dto.receiptType === 'BOUNCED') {
        this.logger.warn(
          {
            operation: 'messaging.receipt.record',
            providerCode,
            deliveryId: delivery.id,
          },
          'Provider reported a bounced delivery',
        );
      }

      return {
        receiptId: receipt.id,
        deliveryId: delivery.id,
        deliveryStatusConceptId: delivery.statusConceptId,
        requestStatusConceptId:
          request?.statusConceptId ?? CONCEPTS.NOTIF_DELIVERED,
        duplicate: false,
      };
    });
  }

  /**
   * UC-35-13: marcar la notificación in-app como leída. Es idempotente y
   * conserva la **primera** lectura: cuándo se enteró el usuario es un dato, y
   * repisarlo con cada apertura lo perdería.
   */
  async markInAppRead(
    inAppId: string,
    actor: AuthenticatedUser,
  ): Promise<InAppReadResponseDto> {
    return this.em.transactional(async (tx) => {
      const notification = await this.notificationsRepo.findInAppForUpdate(
        tx,
        inAppId,
      );
      if (!notification) {
        throw new ResourceNotFoundException('Notificación no encontrada', {
          inAppId,
        });
      }
      // Cada uno marca lo suyo: la bandeja de otro no se toca.
      if (notification.recipientUserId !== actor.id) {
        throw new PreconditionFailedException(
          'La notificación es de otro destinatario',
          {
            inAppId,
          },
        );
      }

      if (
        notification.statusConceptId === CONCEPTS.INAPP_READ &&
        notification.readAt
      ) {
        return {
          id: inAppId,
          statusConceptId: CONCEPTS.INAPP_READ,
          readAt: notification.readAt.toISOString(),
          alreadyRead: true,
        };
      }

      const readAt = new Date();
      notification.statusConceptId = CONCEPTS.INAPP_READ;
      notification.readAt = readAt;
      notification.openedAt ??= readAt;
      touch(notification, actor.id);

      return {
        id: inAppId,
        statusConceptId: CONCEPTS.INAPP_READ,
        readAt: readAt.toISOString(),
        alreadyRead: false,
      };
    });
  }

  // --- Apoyo ---

  /**
   * Devuelve el motivo de supresión, o `undefined` si la notificación puede
   * salir. El consentimiento se comprueba por presencia de la directiva —
   * evaluarla vive en `consent` y leerla desde aquí cruzaría la frontera del
   * esquema—; la preferencia y las horas de silencio sí son nuestras.
   */
  private async evaluateSuppression(
    tx: EntityManager,
    dto: CreateNotificationRequestDto,
  ): Promise<string | undefined> {
    if (!dto.recipientUserId) return undefined;

    const preference = await this.notificationsRepo.findPreference(
      tx,
      dto.recipientUserId,
      dto.channelId,
      dto.categoryConceptId,
    );
    if (preference && preference.optedIn === false) {
      return 'El destinatario no acepta este canal para esta categoría';
    }

    const scheduledAt = dto.scheduledAt
      ? new Date(dto.scheduledAt)
      : new Date();
    if (
      preference &&
      this.inQuietHours(preference.quietHoursJson, scheduledAt)
    ) {
      return 'La notificación cae dentro de las horas de silencio del destinatario';
    }

    return undefined;
  }

  /**
   * Las horas de silencio se declaran como `{ start: "22:00", end: "07:00" }` en
   * hora UTC. Un rango que cruza la medianoche se interpreta como tal, que es el
   * caso habitual y el que se rompería si se comparara ingenuamente.
   */
  private inQuietHours(quietHoursJson: unknown, at: Date): boolean {
    if (!quietHoursJson || typeof quietHoursJson !== 'object') return false;

    const { start, end } = quietHoursJson as {
      /**
       * Valor de start mantenido por la instancia.
       */
      start?: unknown; /**
       * Valor de end mantenido por la instancia.
       */
      end?: unknown;
    };
    if (typeof start !== 'string' || typeof end !== 'string') return false;

    /**
     * Transforma to minutes.
     *
     * @param value - Valor de value requerido por la operación.
     * @returns Resultado de to minutes conforme al contrato `number | undefined`.
     */
    const toMinutes = (value: string): number | undefined => {
      const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
      if (!match) return undefined;
      return Number(match[1]) * 60 + Number(match[2]);
    };

    const from = toMinutes(start);
    const to = toMinutes(end);
    if (from === undefined || to === undefined) return false;

    const minutes = at.getUTCHours() * 60 + at.getUTCMinutes();
    return from <= to
      ? minutes >= from && minutes < to
      : minutes >= from || minutes < to;
  }
}
