import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { createHash, randomUUID } from 'node:crypto';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  SEED,
  UnauthorizedException,
  canonicalJson,
  decodeKeysetCursor,
  deriveWebhookSecret,
  encodeKeysetCursor,
  touch,
  verifySignature,
  type AuthenticatedUser,
} from '../../../common';
import { NotificationsRepository } from '../repositories';
import { NotificationsGateway } from '../gateways';
import {
  CreateNotificationRequestDto,
  NotificationRequestResponseDto,
  PendingNotificationsResponseDto,
  DeliverNotificationDto,
  DeliverNotificationResponseDto,
  ProviderReceiptDto,
  ProviderReceiptResponseDto,
  InAppReadResponseDto,
  InAppNotificationPageDto,
  MarkAllInAppReadResponseDto,
  MyNotificationsQueryDto,
  MyPreferencesDto,
  UpdateMyPreferencesDto,
  type ReceiptType,
} from '../dto';
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_CATEGORY_BY_CONCEPT,
  NOTIFICATION_CATEGORY_CONCEPT,
  type EmitInAppInput,
  type EmitInAppResult,
  type InAppNotificationEmitter,
} from '../notifications.contract';

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
/** Cuántas notificaciones trae la bandeja si nadie pide un tope. */
const DEFAULT_INBOX_PAGE = 20;
/** Tope de filas que marca de una vez «marcar todas como leídas». */
const MARK_ALL_BATCH = 500;
const DEFAULT_PENDING_BATCH = 50;
/** Cuánto puede quedar `NOTIF_SENDING` antes de considerarse huérfana y reclamable de nuevo. */
const SENDING_CLAIM_STALE_MS = 5 * 60_000;

/**
 * Notificaciones: solicitud consciente del consentimiento, entrega multicanal,
 * conciliación de acuses del proveedor y bandeja in-app
 * (UC-35-10 … 13).
 */
@Injectable()
export class NotificationsService implements InAppNotificationEmitter {
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
    // Opcional a propósito: los specs unitarios existentes
    // (`notifications*.service.spec.ts`) construyen el servicio con tres
    // argumentos y no deberían tener que aprender del socket sólo para probar
    // la escritura. En producción, Nest siempre lo resuelve (está en
    // `MessagingModule.providers`).
    private readonly gateway?: NotificationsGateway,
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

      // La solicitud es evidencia: además del qué y a quién, la tabla exige
      // dejar asentado por qué se consideró autorizada y con qué contenido
      // exacto se decidió enviar. El hash permite detectar después que un
      // reintento salió con un contenido distinto del que se autorizó.
      const contentSnapshotJson = {
        templateId: dto.templateId,
        payloadJson: dto.payloadJson ?? null,
        categoryConceptId: dto.categoryConceptId ?? null,
      };
      const authorizationSnapshotJson = {
        consentId: dto.consentId ?? null,
        suppressed: suppression !== undefined,
        suppressionReason: suppression ?? null,
        evaluatedAt: new Date().toISOString(),
        authorizedByUserId: actor.id,
      };

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
        // `debounceKey` ya identifica una solicitud lógica repetida; cuando no
        // se aporta, cada solicitud es única por definición.
        idempotencyKey: dto.debounceKey ?? `notif-${randomUUID()}`,
        recipientTypeConceptId: CONCEPTS.NOTIF_RECIPIENT_USER,
        // Un canal externo puede no tener destinatario interno; en ese caso la
        // referencia es el propio actor que solicitó el envío.
        recipientRefId: dto.recipientUserId ?? actor.id,
        sourceConceptId: CONCEPTS.NOTIF_SOURCE_SYSTEM,
        authorizedByUserId: actor.id,
        authorizationSnapshotJson,
        contentSnapshotJson,
        contentHash: createHash('sha256')
          .update(canonicalJson(contentSnapshotJson))
          .digest('hex'),
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
   * Lote de solicitudes listas para intentar entrega, por prioridad y
   * antigüedad. La usa el worker de notificaciones (Fase 1) para descubrir
   * qué llamar en `deliverNotification` — sin esta consulta el worker no
   * tenía forma de saber qué solicitudes existían.
   */
  async listDeliverable(
    limit?: number,
  ): Promise<PendingNotificationsResponseDto> {
    return this.em.transactional(async (tx) => {
      const now = new Date();
      const requests = await this.notificationsRepo.findClaimableRequests(
        tx,
        CONCEPTS.NOTIF_PENDING,
        CONCEPTS.NOTIF_SENDING,
        now,
        new Date(now.getTime() - SENDING_CLAIM_STALE_MS),
        limit ?? DEFAULT_PENDING_BATCH,
      );

      // Reclama el lote (PENDING/SENDING-huérfana → SENDING) ANTES de
      // devolverlo: el llamador entrega al proveedor real fuera de esta
      // transacción, así que sólo el estado persistido (no el lock, que se
      // libera al hacer commit) evita que un tick solapado vuelva a
      // descubrir y reenviar la misma solicitud.
      for (const request of requests) {
        request.statusConceptId = CONCEPTS.NOTIF_SENDING;
        touch(request, SEED.systemWorkerUserId, now);
      }
      await tx.flush();

      // El tipo de canal se resuelve una vez por canal distinto del lote, no
      // una por solicitud: un lote de cincuenta correos es un solo canal.
      const channelTypes = new Map<string, string>();
      for (const channelId of new Set(requests.map((r) => r.channelId))) {
        const channel = await this.notificationsRepo.findChannelById(
          tx,
          channelId,
        );
        if (channel) channelTypes.set(channelId, channel.channelTypeConceptId);
      }

      return {
        requests: requests.map((request) => ({
          id: request.id,
          channelId: request.channelId,
          channelTypeConceptId: channelTypes.get(request.channelId),
          statusConceptId: request.statusConceptId,
          payloadJson: request.payloadJson,
          recipientAddress: request.recipientAddress,
          recipientUserId: request.recipientUserId,
        })),
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

      // `adapter_code`/`adapter_version` son NOT NULL en la entrega: los declara
      // el proveedor, que es quien sabe con qué implementación se envió.
      const provider = await this.notificationsRepo.findProviderById(
        tx,
        config.providerId,
      );
      if (!provider) {
        throw new ResourceNotFoundException(
          'El proveedor configurado para el canal no existe',
          { requestId, providerId: config.providerId },
        );
      }

      const sent = dto.outcome === 'SENT';
      const now = new Date();
      const delivery = this.notificationsRepo.createDelivery(tx, {
        notificationRequestId: requestId,
        providerId: config.providerId,
        channelId: request.channelId,
        providerChannelConfigId: config.id,
        adapterCode: provider.adapterCode,
        adapterVersion: provider.adapterVersion,
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
      //
      // La entrega se materializa **antes** de crear la fila de la bandeja, y
      // no por gusto: `in_app_notifications.notification_delivery_id` es una FK
      // NOT NULL a la entrega, y el orden en que la unidad de trabajo inserta
      // no lo decide el orden en que se crean las entidades. Sin este `flush`,
      // Postgres rechazaba la bandeja con
      // `fk_in_app_notifications_notification_delivery_id` — es decir, **toda**
      // notificación in-app fallaba. No se había visto porque hasta el carril
      // P8 no existía ningún canal in-app sembrado y esta rama nunca corría.
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

        // Ver el comentario de arriba: la entrega tiene que existir en la base
        // antes de que la bandeja la referencie.
        await tx.flush();

        inAppNotificationId = this.notificationsRepo.createInAppNotification(
          tx,
          {
            recipientUserId: request.recipientUserId,
            tenantId: request.tenantId,
            // NOT NULL: qué clase de canal originó la bandeja. Aquí siempre es
            // in-app, que es la única rama que crea esta fila.
            channelConceptId: CONCEPTS.CHANNEL_TYPE_IN_APP,
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

  /**
   * Carril P1 · emite una notificación in-app. **No lanza.**
   *
   * ## Por qué la entrega es inmediata y no la hace el worker
   *
   * El resto de los canales pasan por `listDeliverable` → worker → proveedor →
   * `deliverNotification`, porque del otro lado hay un tercero cuya latencia no
   * controlamos y una transacción abierta esperándolo agota el pool. El canal
   * in-app **no tiene tercero**: entregarlo es escribir una fila nuestra. Pasar
   * por el worker le agregaría hasta un tic de demora a la campana sin comprar
   * nada, y ataría la funcionalidad más visible del producto a que un proceso
   * aparte esté vivo.
   *
   * Se escriben igual la solicitud y la entrega, con su intento y su proveedor
   * `IN_APP_DIRECT`: la auditoría de mensajería sigue contando la misma
   * historia para todos los canales, y una in-app se puede rastrear con las
   * mismas consultas que un correo.
   *
   * ## Por qué no lanza
   *
   * Porque quien la llama está a mitad de emitir una receta o de guardar un
   * mensaje. Si notificar pudiera fallar hacia arriba, un problema de la
   * campana desharía un acto clínico. El fallo se registra y se devuelve en
   * `failed`, que es donde una prueba lo puede afirmar.
   *
   * @param input - Destinatario, categoría, texto y destino navegable.
   * @returns Qué se creó, o por qué no se creó nada.
   */
  async emitInApp(input: EmitInAppInput): Promise<EmitInAppResult> {
    try {
      const result = await this.em.transactional((tx) =>
        this.writeInApp(tx, input),
      );
      // AG-22: el socket se empuja DESPUÉS del commit y fuera de cualquier
      // lock — nunca desde dentro de `writeInApp`. Si quedó suprimida, si el
      // silencio nocturno la aplazó a más tarde, o si no llegó a crear la fila
      // de bandeja, no hay nada que empujar: el sondeo de respaldo la sirve
      // cuando corresponda.
      if (
        !result.suppressed &&
        result.inAppNotificationId &&
        result.availableAt &&
        new Date(result.availableAt).getTime() <= Date.now()
      ) {
        this.gateway?.notifyUser(input.recipientUserId, {
          id: result.inAppNotificationId,
          category: input.category,
          subject: input.subject,
          bodyText: input.bodyText ?? null,
          destination: input.destination ?? null,
          availableAt: result.availableAt,
        });
      }
      return result;
    } catch (error) {
      // Un fallo acá no puede tumbar la receta que lo disparó: se registra con
      // todo lo necesario para reconstruirlo y el caso de uso sigue.
      this.logger.error(
        {
          operation: 'messaging.notification.emit-in-app',
          recipientUserId: input.recipientUserId,
          category: input.category,
          err: error,
        },
        'No se pudo emitir la notificación in-app',
      );
      return { suppressed: false, failed: true };
    }
  }

  /**
   * Carril P1 · la bandeja de quien pregunta.
   *
   * Es la lectura que faltaba. `GET /internal/notifications/pending` reclama
   * solicitudes para entregar —es del worker y devuelve trabajo, no avisos— y
   * `POST /notifications/in-app/:id/read` ya permitía marcar una notificación
   * que no había forma de listar. La campana necesitaba justamente esto.
   *
   * @param actor - Dueño de la bandeja. No se lee la de nadie más.
   * @param query - Filtro de no leídas, cursor y tope.
   * @returns La página pedida, con el total sin leer para el badge.
   */
  async listMine(
    actor: AuthenticatedUser,
    query: MyNotificationsQueryDto,
  ): Promise<InAppNotificationPageDto> {
    const em = this.em.fork();
    const limit = query.limit ?? DEFAULT_INBOX_PAGE;

    const after = query.cursor ? decodeKeysetCursor(query.cursor) : undefined;
    const afterKey =
      typeof after?.availableAt === 'string' && typeof after?.id === 'string'
        ? { availableAt: new Date(after.availableAt), id: after.id }
        : undefined;

    // Se pide una de más para saber si hay página siguiente sin contar el total.
    const rows = await this.notificationsRepo.listInAppPage(em, actor.id, {
      unreadOnly: query.unread === true,
      after: afterKey,
      limit: limit + 1,
      unreadStatusConceptId: CONCEPTS.INAPP_UNREAD,
      now: new Date(),
    });
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page.at(-1);

    const unreadCount = await this.notificationsRepo.countUnreadInApp(
      em,
      actor.id,
      CONCEPTS.INAPP_UNREAD,
    );

    return {
      items: page.map((row) => ({
        id: row.id,
        category:
          NOTIFICATION_CATEGORY_BY_CONCEPT.get(row.categoryConceptId ?? '') ??
          null,
        subject: row.subject ?? null,
        bodyText: row.bodyText ?? null,
        destination: row.relatedResourceType
          ? { type: row.relatedResourceType, id: row.relatedResourceId ?? '' }
          : null,
        payloadJson: row.payloadJson ?? null,
        unread: row.statusConceptId !== CONCEPTS.INAPP_READ,
        availableAt: row.availableAt.toISOString(),
        readAt: row.readAt ? row.readAt.toISOString() : null,
      })),
      count: page.length,
      limit,
      nextCursor:
        hasMore && last
          ? encodeKeysetCursor({
              availableAt: last.availableAt.toISOString(),
              id: last.id,
            })
          : null,
      unreadCount,
    };
  }

  /**
   * Carril P1 · marca toda la bandeja como leída.
   *
   * Existe porque sin esto la única forma de bajar un badge de 40 es abrir 40
   * notificaciones, y quien tiene 40 avisos viejos no los va a abrir: va a
   * aprender a ignorar la campana, que es el modo en que una notificación deja
   * de notificar.
   *
   * Acota el lote y devuelve cuántas quedan: con una bandeja enorme, dos
   * llamadas terminan el trabajo y ninguna toma la tabla entera.
   *
   * @param actor - Dueño de la bandeja.
   * @returns Cuántas se marcaron y cuántas quedan sin leer.
   */
  async markAllInAppRead(
    actor: AuthenticatedUser,
  ): Promise<MarkAllInAppReadResponseDto> {
    return this.em.transactional(async (tx) => {
      const pendientes = await this.notificationsRepo.findUnreadInApp(
        tx,
        actor.id,
        CONCEPTS.INAPP_UNREAD,
        MARK_ALL_BATCH,
      );

      const readAt = new Date();
      for (const notification of pendientes) {
        notification.statusConceptId = CONCEPTS.INAPP_READ;
        notification.readAt ??= readAt;
        notification.openedAt ??= readAt;
        touch(notification, actor.id, readAt);
      }
      await tx.flush();

      const unreadCount = await this.notificationsRepo.countUnreadInApp(
        tx,
        actor.id,
        CONCEPTS.INAPP_UNREAD,
      );
      return { marked: pendientes.length, unreadCount };
    });
  }

  /**
   * Carril P9 · las preferencias in-app de quien pregunta.
   *
   * **Siempre devuelve las cuatro categorías**, haya filas o no. Quien nunca
   * tocó nada las recibe todas en `true`, que es lo que efectivamente le pasa:
   * `evaluateSuppression` sólo suprime cuando encuentra un `opted_in = false`.
   * Devolver una lista vacía obligaría a la pantalla a saber cuál es el
   * comportamiento por defecto del emisor, y esa es exactamente la clase de
   * conocimiento duplicado que después se desincroniza.
   *
   * @param actor - Dueño de las preferencias.
   * @returns Las cuatro categorías y la ventana de silencio.
   */
  async readMyPreferences(actor: AuthenticatedUser): Promise<MyPreferencesDto> {
    const em = this.em.fork();
    const channel = await this.notificationsRepo.findActiveChannelByType(
      em,
      CONCEPTS.CHANNEL_TYPE_IN_APP,
      CONCEPTS.STATE_ACTIVE,
    );
    if (!channel) {
      throw new PreconditionFailedException(
        'No hay canal in-app activo: falta correr el seed de mensajería',
        { userId: actor.id },
      );
    }

    const filas = await this.notificationsRepo.findPreferences(
      em,
      actor.id,
      channel.id,
    );
    const porCategoria = new Map(
      filas
        .filter((fila) => fila.categoryConceptId)
        .map((fila) => [fila.categoryConceptId, fila]),
    );

    return {
      categories: NOTIFICATION_CATEGORIES.map((category) => ({
        category,
        optedIn:
          porCategoria.get(NOTIFICATION_CATEGORY_CONCEPT[category])?.optedIn ??
          true,
      })),
      quietHours: this.leerHorasDeSilencio(
        filas.find((fila) => !fila.categoryConceptId)?.quietHoursJson,
      ),
    };
  }

  /**
   * Carril P9 · guarda las preferencias.
   *
   * Es un reemplazo **por categoría**: lo que no viene no se toca. Mandar el
   * conjunto entero obligaría a la pantalla a reenviar decisiones que la
   * persona no tocó, y a pisar las que hubiera cambiado en otra pestaña.
   *
   * La ventana de silencio vive en la fila **sin categoría**: es del canal
   * entero. Guardarla por categoría permitiría configurar cuatro silencios
   * distintos, que es una pantalla que nadie termina de leer y una regla que
   * nadie sabría explicar.
   *
   * @param actor - Dueño de las preferencias.
   * @param dto - Qué cambia.
   * @returns Las preferencias ya guardadas.
   */
  async updateMyPreferences(
    actor: AuthenticatedUser,
    dto: UpdateMyPreferencesDto,
  ): Promise<MyPreferencesDto> {
    await this.em.transactional(async (tx) => {
      const channel = await this.notificationsRepo.findActiveChannelByType(
        tx,
        CONCEPTS.CHANNEL_TYPE_IN_APP,
        CONCEPTS.STATE_ACTIVE,
      );
      if (!channel) {
        throw new PreconditionFailedException(
          'No hay canal in-app activo: falta correr el seed de mensajería',
          { userId: actor.id },
        );
      }

      const filas = await this.notificationsRepo.findPreferences(
        tx,
        actor.id,
        channel.id,
      );

      for (const cambio of dto.categories ?? []) {
        const conceptId = NOTIFICATION_CATEGORY_CONCEPT[cambio.category];
        const fila = filas.find(
          (candidata) => candidata.categoryConceptId === conceptId,
        );
        if (fila) {
          fila.optedIn = cambio.optedIn;
          touch(fila, actor.id);
        } else {
          this.notificationsRepo.createPreference(tx, {
            userId: actor.id,
            channelId: channel.id,
            categoryConceptId: conceptId,
            optedIn: cambio.optedIn,
            actorUserId: actor.id,
          });
        }
      }

      // `undefined` significa «no la toques»; `null`, «quitala».
      if (dto.quietHours !== undefined) {
        const valor =
          dto.quietHours === null
            ? undefined
            : { start: dto.quietHours.start, end: dto.quietHours.end };
        const fila = filas.find((candidata) => !candidata.categoryConceptId);
        if (fila) {
          fila.quietHoursJson = valor;
          touch(fila, actor.id);
        } else {
          this.notificationsRepo.createPreference(tx, {
            userId: actor.id,
            channelId: channel.id,
            // Sin categoría: gobierna el canal entero.
            optedIn: true,
            quietHoursJson: valor,
            actorUserId: actor.id,
          });
        }
      }

      await tx.flush();
    });

    return this.readMyPreferences(actor);
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
    dto: {
      /** Canal por el que saldría. */
      channelId: string;
      /** Destinatario interno, si lo hay. */
      recipientUserId?: string;
      /** Categoría, que es la unidad de preferencia. */
      categoryConceptId?: string;
      /** Cuándo saldría, para las horas de silencio. */
      scheduledAt?: string;
      /**
       * Saltearse las horas de silencio (carril P9).
       *
       * Sólo lo pide el canal in-app, que las aplaza en vez de suprimirlas.
       * Los canales externos las siguen respetando como supresión: un correo
       * aplazado llegaría igual y sonaría el teléfono.
       */
      ignoreQuietHours?: boolean;
    },
  ): Promise<string | undefined> {
    if (!dto.recipientUserId) return undefined;

    // Dos filas gobiernan la decisión y hay que mirar las dos (carril P9): la
    // de la categoría dice si acepta ESE tipo de aviso, y la del canal —sin
    // categoría— guarda la ventana de silencio, que es del canal entero.
    // Mirando sólo la de la categoría, el silencio nocturno no se aplicaba
    // nunca: la fila que lo guarda no coincidía con el filtro.
    const preferences = await this.notificationsRepo.findPreferences(
      tx,
      dto.recipientUserId,
      dto.channelId,
    );
    const deCategoria = dto.categoryConceptId
      ? preferences.find(
          (preference) =>
            preference.categoryConceptId === dto.categoryConceptId,
        )
      : undefined;
    const deCanal = preferences.find(
      (preference) => !preference.categoryConceptId,
    );

    if (deCategoria?.optedIn === false) {
      return 'El destinatario no acepta este canal para esta categoría';
    }
    if (deCanal?.optedIn === false) {
      return 'El destinatario no acepta este canal';
    }

    if (dto.ignoreQuietHours) return undefined;

    const scheduledAt = dto.scheduledAt
      ? new Date(dto.scheduledAt)
      : new Date();
    const horasDeSilencio =
      deCategoria?.quietHoursJson ?? deCanal?.quietHoursJson;
    if (this.inQuietHours(horasDeSilencio, scheduledAt)) {
      return 'La notificación cae dentro de las horas de silencio del destinatario';
    }

    return undefined;
  }

  /**
   * Cuándo queda visible una in-app: ahora, o al final del silencio nocturno.
   *
   * @param tx - Transacción activa.
   * @param recipientUserId - Destinatario.
   * @param channelId - Canal in-app.
   * @param categoryConceptId - Categoría del aviso.
   * @returns El instante desde el que se muestra.
   */
  private async aplazarPorSilencio(
    tx: EntityManager,
    recipientUserId: string,
    channelId: string,
    categoryConceptId: string,
  ): Promise<Date> {
    const ahora = new Date();
    const preferences = await this.notificationsRepo.findPreferences(
      tx,
      recipientUserId,
      channelId,
    );
    const ventana =
      preferences.find(
        (preference) => preference.categoryConceptId === categoryConceptId,
      )?.quietHoursJson ??
      preferences.find((preference) => !preference.categoryConceptId)
        ?.quietHoursJson;

    if (!this.inQuietHours(ventana, ahora)) return ahora;

    const fin = this.finDeVentana(ventana);
    if (fin === undefined) return ahora;

    const disponible = new Date(ahora);
    disponible.setUTCHours(Math.floor(fin / 60), fin % 60, 0, 0);
    // Si el fin ya pasó hoy, la ventana cruza la medianoche: termina mañana.
    if (disponible <= ahora) {
      disponible.setUTCDate(disponible.getUTCDate() + 1);
    }
    return disponible;
  }

  /** Los minutos UTC en que termina la ventana, o `undefined`. */
  private finDeVentana(quietHoursJson: unknown): number | undefined {
    if (!quietHoursJson || typeof quietHoursJson !== 'object') return undefined;
    const { end } = quietHoursJson as {
      /** Hora de fin. */
      end?: unknown;
    };
    if (typeof end !== 'string') return undefined;
    const match = /^(\d{1,2}):(\d{2})$/.exec(end.trim());
    return match ? Number(match[1]) * 60 + Number(match[2]) : undefined;
  }

  /**
   * Lee la ventana de silencio guardada, o `null` si no hay una válida.
   *
   * Una ventana con formato roto se trata como ausente y no como error: el
   * emisor ya la ignora con la misma lógica, y devolver un 500 al abrir la
   * pantalla de preferencias por una fila vieja mal escrita dejaría a alguien
   * sin poder arreglarla.
   */
  private leerHorasDeSilencio(
    quietHoursJson: unknown,
  ): { start: string; end: string } | null {
    if (!quietHoursJson || typeof quietHoursJson !== 'object') return null;
    const { start, end } = quietHoursJson as {
      /** Hora de inicio. */
      start?: unknown;
      /** Hora de fin. */
      end?: unknown;
    };
    return typeof start === 'string' && typeof end === 'string'
      ? { start, end }
      : null;
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

  /**
   * La escritura de `emitInApp`, dentro de una sola transacción.
   *
   * Hace en un paso lo que para un canal externo son tres —solicitud, intento
   * de entrega y fila de bandeja— porque para el in-app los tres ocurren a la
   * vez, y separarlos sólo dejaría estados intermedios que nadie puede
   * resolver: una solicitud in-app «pendiente» no está esperando a nadie.
   */
  private async writeInApp(
    tx: EntityManager,
    input: EmitInAppInput,
  ): Promise<EmitInAppResult> {
    const channel = await this.notificationsRepo.findActiveChannelByType(
      tx,
      CONCEPTS.CHANNEL_TYPE_IN_APP,
      CONCEPTS.STATE_ACTIVE,
    );
    if (!channel) {
      throw new PreconditionFailedException(
        'No hay canal in-app activo: falta correr el seed de mensajería',
        { recipientUserId: input.recipientUserId },
      );
    }

    const categoryConceptId = NOTIFICATION_CATEGORY_CONCEPT[input.category];
    const actorUserId = input.actorUserId ?? SEED.systemWorkerUserId;

    // El rebote colapsa el mismo aviso repetido —diez mensajes seguidos en un
    // hilo son un campanazo, no diez— y conserva el primero.
    //
    // Se mira si ya hay un aviso **sin leer** apuntando al mismo objeto, y no
    // si la solicitud sigue «viva» como en los canales externos: una solicitud
    // in-app nace `SENT` y se queda así para siempre, de modo que con aquel
    // criterio una conversación habría avisado una sola vez en toda su
    // historia. En cuanto la persona lo lee, el siguiente mensaje vuelve a
    // avisar, que es lo que cualquiera espera de una bandeja.
    if (input.destination) {
      const sinLeer = await this.notificationsRepo.findUnreadInAppForResource(
        tx,
        input.recipientUserId,
        input.destination.type,
        input.destination.id,
        CONCEPTS.INAPP_UNREAD,
      );
      if (sinLeer) {
        return {
          inAppNotificationId: sinLeer.id,
          requestId: sinLeer.notificationRequestId,
          suppressed: false,
        };
      }
    }

    const suppression = await this.evaluateSuppression(tx, {
      channelId: channel.id,
      recipientUserId: input.recipientUserId,
      categoryConceptId,
      // El in-app no se suprime por horario: se aplaza. Se pide la evaluación
      // sin horas de silencio y el aplazamiento se calcula aparte.
      ignoreQuietHours: true,
    });

    // Carril P9 · el silencio nocturno **aplaza, no borra**.
    //
    // Para un correo, caer en horas de silencio significa no mandarlo: llegaría
    // igual y sonaría el teléfono. Una notificación in-app no suena — está
    // esperando en una bandeja—, así que suprimirla haría que el paciente nunca
    // se entere de algo que sí ocurrió. Se crea con `available_at` al final de
    // la ventana y aparece a la mañana, que es literalmente lo que el carril
    // pide: «no crece entre 22:00 y 07:00; se muestra a la mañana».
    const availableAt = await this.aplazarPorSilencio(
      tx,
      input.recipientUserId,
      channel.id,
      categoryConceptId,
    );

    const contentSnapshotJson = {
      subject: input.subject,
      bodyText: input.bodyText ?? null,
      categoryConceptId,
    };
    const now = new Date();

    const request = this.notificationsRepo.createNotificationRequest(tx, {
      tenantId: input.tenantId,
      recipientUserId: input.recipientUserId,
      channelId: channel.id,
      payloadJson: input.payloadJson,
      debounceKey: input.debounceKey,
      priority: DEFAULT_PRIORITY,
      categoryConceptId,
      relatedResourceType: input.destination?.type,
      relatedResourceId: input.destination?.id,
      statusConceptId: suppression
        ? CONCEPTS.NOTIF_SUPPRESSED
        : CONCEPTS.NOTIF_SENT,
      scheduledAt: now,
      idempotencyKey: input.debounceKey ?? `in-app-${randomUUID()}`,
      recipientTypeConceptId: CONCEPTS.NOTIF_RECIPIENT_USER,
      recipientRefId: input.recipientUserId,
      sourceConceptId: CONCEPTS.NOTIF_SOURCE_SYSTEM,
      authorizedByUserId: actorUserId,
      authorizationSnapshotJson: {
        suppressed: suppression !== undefined,
        suppressionReason: suppression ?? null,
        evaluatedAt: now.toISOString(),
        authorizedByUserId: actorUserId,
      },
      contentSnapshotJson,
      contentHash: createHash('sha256')
        .update(canonicalJson(contentSnapshotJson))
        .digest('hex'),
      actorUserId,
    });
    await tx.flush();

    if (suppression) {
      this.logger.info(
        {
          operation: 'messaging.notification.emit-in-app',
          requestId: request.id,
          reason: suppression,
        },
        'In-app notification suppressed by recipient preference',
      );
      return {
        requestId: request.id,
        suppressed: true,
        suppressionReason: suppression,
      };
    }

    // La entrega existe aunque no haya proveedor externo: es la fila que
    // convierte «se pidió avisar» en «se avisó», y la que
    // `in_app_notifications.notification_delivery_id` exige NOT NULL.
    const configs = await this.notificationsRepo.findChannelConfigs(
      tx,
      channel.id,
      CONCEPTS.STATE_ACTIVE,
    );
    const config = configs[0];
    if (!config) {
      throw new PreconditionFailedException(
        'El canal in-app no tiene configuración de proveedor activa',
        { channelId: channel.id },
      );
    }
    const provider = await this.notificationsRepo.findProviderById(
      tx,
      config.providerId,
    );
    if (!provider) {
      throw new ResourceNotFoundException(
        'El proveedor configurado para el canal in-app no existe',
        { providerId: config.providerId },
      );
    }

    const delivery = this.notificationsRepo.createDelivery(tx, {
      notificationRequestId: request.id,
      providerId: config.providerId,
      channelId: channel.id,
      providerChannelConfigId: config.id,
      adapterCode: provider.adapterCode,
      adapterVersion: provider.adapterVersion,
      attemptNumber: 1,
      // DELIVERED y no SENT: en el resto de los canales «entregado» lo confirma
      // un acuse del proveedor que acá no va a llegar nunca, porque el
      // destinatario de la entrega es nuestra propia tabla.
      statusConceptId: CONCEPTS.NOTIF_DELIVERY_DELIVERED,
      sentAt: now,
      actorUserId,
    });
    await tx.flush();

    const inApp = this.notificationsRepo.createInAppNotification(tx, {
      recipientUserId: input.recipientUserId,
      tenantId: input.tenantId,
      channelConceptId: CONCEPTS.CHANNEL_TYPE_IN_APP,
      categoryConceptId,
      subject: input.subject,
      bodyText: input.bodyText,
      payloadJson: input.payloadJson,
      relatedResourceType: input.destination?.type,
      relatedResourceId: input.destination?.id,
      statusConceptId: CONCEPTS.INAPP_UNREAD,
      notificationRequestId: request.id,
      notificationDeliveryId: delivery.id,
      actorUserId,
      availableAt,
    });
    await tx.flush();

    this.logger.info(
      {
        operation: 'messaging.notification.emit-in-app',
        requestId: request.id,
        inAppNotificationId: inApp.id,
        category: input.category,
      },
      'In-app notification delivered',
    );

    return {
      requestId: request.id,
      inAppNotificationId: inApp.id,
      suppressed: false,
      availableAt: availableAt.toISOString(),
    };
  }
}
