import { createHash, randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import {
  APP_ATTR,
  MessagingTraceService,
  TRACE_CARRIER_KEY,
  type TraceCarrier,
} from '../../../observability';
import { OutboxRepository, QueuesRepository } from '../repositories';
import { DomainEvents } from '../entities';
import {
  RunOutboxRelayDto,
  OutboxRelayResponseDto,
  RelayedMessageDto,
  DispatchEventDto,
  DispatchEventResponseDto,
  DispatchedSubscriberDto,
  AckEventDeliveryDto,
  EventDeliveryResponseDto,
} from '../dto';

/** Lo que un módulo de negocio entrega para publicar un hecho suyo. */
export interface PublishDomainEventInput {
  /**
   * Identificador asociado a tenant.
   */
  tenantId?: string;
  /**
   * Valor de event type mantenido por la instancia.
   */
  eventType: string;
  /**
   * Valor de event version mantenido por la instancia.
   */
  eventVersion?: number;
  /**
   * Valor de aggregate type mantenido por la instancia.
   */
  aggregateType: string;
  /**
   * Identificador asociado a aggregate.
   */
  aggregateId: string;
  /**
   * Valor de payload json mantenido por la instancia.
   */
  payloadJson: Record<string, unknown>;
  /**
   * Valor de metadata json mantenido por la instancia.
   */
  metadataJson?: Record<string, unknown>;
  /**
   * Identificador asociado a correlation.
   */
  correlationId?: string;
  /**
   * Identificador asociado a causation.
   */
  causationId?: string;
  /**
   * Valor de occurred at mantenido por la instancia.
   */
  occurredAt?: Date;
  /** Si no se declara, se deriva del contenido del evento. */
  idempotencyKey?: string;
  /**
   * Valor de max attempts mantenido por la instancia.
   */
  maxAttempts?: number;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de publish domain event result.
 */
export interface PublishDomainEventResult {
  /**
   * Identificador asociado a domain event.
   */
  domainEventId: string;
  /**
   * Identificador asociado a outbox message.
   */
  outboxMessageId: string;
  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  idempotencyKey: string;
  /** `true` si ese hecho ya estaba publicado y no se volvió a encolar. */
  duplicate: boolean;
}

const DEFAULT_EVENT_VERSION = 1;
const DEFAULT_MAX_ATTEMPTS = 8;
const DEFAULT_BATCH_SIZE = 50;
const DEFAULT_VISIBILITY_SECONDS = 60;
const BACKOFF_BASE_SECONDS = 5;
const BACKOFF_CAP_SECONDS = 3600;

/** Versión efectiva del evento; centraliza el default para no repetirlo. */
function eventVersionOf(input: PublishDomainEventInput): number {
  return input.eventVersion ?? DEFAULT_EVENT_VERSION;
}

/**
 * Adjunta el contexto de traza a la metadata del evento.
 *
 * Con la telemetría deshabilitada el carrier viene vacío y se devuelve la
 * metadata original **sin tocar** —incluido `undefined`—, de modo que la fila
 * escrita en `messaging.domain_events` es byte a byte la misma que antes de
 * esta iniciativa.
 */
function withTraceCarrier(
  metadata: Record<string, unknown> | undefined,
  carrier: TraceCarrier,
): Record<string, unknown> | undefined {
  if (Object.keys(carrier).length === 0) return metadata;
  return { ...(metadata ?? {}), [TRACE_CARRIER_KEY]: carrier };
}

/**
 * Outbox: publicación transaccional de eventos de dominio, relay a publicado y
 * fan-out a suscriptores (UC-35-01 … 04).
 *
 * El patrón entero existe por una razón: **nunca se llama a un sistema externo
 * dentro de la transacción de negocio**. El cambio y el hecho que lo describe se
 * confirman juntos; entregarlo es problema de otro momento y de otro proceso.
 */
@Injectable()
export class OutboxService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param outboxRepo - Valor de outbox repo requerido por la operación.
   * @param queuesRepo - Valor de queues repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   * @param messagingTrace - Propagación del contexto de traza a través del
   *                         outbox: sin ella, publicación y consumo aparecen
   *                         como dos trazas inconexas separadas por minutos.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly outboxRepo: OutboxRepository,
    private readonly queuesRepo: QueuesRepository,
    private readonly logger: PinoLogger,
    private readonly messagingTrace: MessagingTraceService,
  ) {
    this.logger.setContext(OutboxService.name);
  }

  /**
   * UC-35-01: publicar un evento de dominio.
   *
   * **No abre transacción propia**: recibe el `EntityManager` de quien la tiene
   * abierta y se enlista en ella. Es lo que hace que el evento se confirme —o se
   * pierda— exactamente con el cambio de negocio que lo produjo. Si abriera la
   * suya, un fallo posterior dejaría publicado un hecho que nunca ocurrió.
   *
   * Los módulos de negocio la llaman así:
   *
   * ```ts
   * return this.em.transactional(async (tx) => {
   *   const pedido = this.repo.crearPedido(tx, ...);
   *   await this.outbox.publishDomainEvent(tx, {
   *     eventType: 'OrderPlaced', aggregateType: 'orders', aggregateId: pedido.id,
   *     payloadJson: { ... },
   *   });
   *   return { id: pedido.id };
   * });
   * ```
   */
  async publishDomainEvent(
    tx: EntityManager,
    input: PublishDomainEventInput,
  ): Promise<PublishDomainEventResult> {
    // Span PRODUCER: es el punto donde la traza de la petición HTTP se "guarda"
    // dentro del evento para que el consumidor, en otro proceso y otro momento,
    // pueda continuarla en vez de empezar una nueva.
    return this.messagingTrace.runInProducerSpan(
      'messaging.outbox publish',
      {
        [APP_ATTR.MODULE]: 'messaging',
        [APP_ATTR.OPERATION]: 'outbox.publish',
        [APP_ATTR.EVENT_TYPE]: input.eventType,
        [APP_ATTR.ENTITY_TYPE]: input.aggregateType,
        [APP_ATTR.ENTITY_ID]: input.aggregateId,
        [APP_ATTR.TENANT_ID]: input.tenantId,
        'messaging.system': 'postgresql_outbox',
        'messaging.destination.name': 'messaging.outbox_messages',
        'messaging.operation.type': 'publish',
      },
      (span, carrier) =>
        this.persistDomainEvent(tx, input, eventVersionOf(input), carrier).then(
          (result) => {
            span.setAttributes({
              [APP_ATTR.EVENT_ID]: result.domainEventId,
              'messaging.message.id': result.outboxMessageId,
              'messaging.outbox.duplicate': result.duplicate,
            });
            return result;
          },
        ),
    );
  }

  /**
   * Escritura transaccional del evento y su mensaje de outbox.
   *
   * Se separó de `publishDomainEvent` al añadir el span productor: la lógica de
   * persistencia no cambió, solo dejó de estar mezclada con la instrumentación.
   */
  private async persistDomainEvent(
    tx: EntityManager,
    input: PublishDomainEventInput,
    eventVersion: number,
    carrier: TraceCarrier,
  ): Promise<PublishDomainEventResult> {
    const idempotencyKey =
      input.idempotencyKey ??
      this.deriveIdempotencyKey(
        input.eventType,
        eventVersion,
        input.aggregateId,
        input.payloadJson,
      );

    // Publicar dos veces el mismo hecho haría que los consumidores lo
    // procesaran dos veces; la clave lo corta aquí, no en cada consumidor.
    const existing = await this.outboxRepo.findOutboxByIdempotencyKey(
      tx,
      idempotencyKey,
    );
    if (existing) {
      return {
        domainEventId: existing.domainEventId,
        outboxMessageId: existing.id,
        idempotencyKey,
        duplicate: true,
      };
    }

    const event = this.outboxRepo.createDomainEvent(tx, {
      tenantId: input.tenantId,
      eventType: input.eventType,
      eventVersion,
      aggregateType: input.aggregateType,
      aggregateId: input.aggregateId,
      payloadJson: input.payloadJson,
      // El contexto de traza viaja en la METADATA, nunca en el payload: el
      // payload alimenta `deriveIdempotencyKey`, y meter ahí un `traceparent`
      // -distinto en cada petición- haría que el mismo hecho publicado dos
      // veces generara claves distintas y rompiera la idempotencia del outbox.
      metadataJson: withTraceCarrier(input.metadataJson, carrier),
      // La columna es NOT NULL: sin un correlation id de un flujo mayor que
      // propagar (p. ej. el de la petición HTTP que originó el cambio), el
      // evento es su propia correlación — nunca dejar la inserción sin valor.
      correlationId: input.correlationId ?? randomUUID(),
      causationId: input.causationId,
      occurredAt: input.occurredAt,
      recordedByUserId: input.actorUserId,
    });
    // `domain_event_id` es un uuid plano (no una relación de MikroORM), así
    // que el ORM no sabe que el outbox message depende del evento y puede
    // intentar insertarlos en el orden equivocado dentro del mismo flush.
    // Flush explícito para que el evento ya exista en la fila antes de crear
    // el mensaje que lo referencia por FK.
    await tx.flush();

    const message = this.outboxRepo.createOutboxMessage(tx, {
      tenantId: input.tenantId,
      domainEventId: event.id,
      aggregateType: input.aggregateType,
      aggregateId: input.aggregateId,
      idempotencyKey,
      payloadJson: input.payloadJson,
      statusConceptId: CONCEPTS.OUTBOX_PENDING,
      maxAttempts: input.maxAttempts ?? DEFAULT_MAX_ATTEMPTS,
      actorUserId: input.actorUserId,
    });

    return {
      domainEventId: event.id,
      outboxMessageId: message.id,
      idempotencyKey,
      duplicate: false,
    };
  }

  /**
   * UC-35-02: reclamar un lote de mensajes pendientes y darlos por publicados.
   *
   * El lote se toma con `FOR UPDATE SKIP LOCKED`, así que varios relays pueden
   * correr a la vez sin estorbarse: cada uno se lleva mensajes distintos en
   * lugar de esperar al otro.
   */
  async runRelay(dto: RunOutboxRelayDto): Promise<OutboxRelayResponseDto> {
    const batchSize = dto.batchSize ?? DEFAULT_BATCH_SIZE;
    const visibility =
      dto.visibilityTimeoutSeconds ?? DEFAULT_VISIBILITY_SECONDS;

    return this.em.transactional(async (tx) => {
      const now = new Date();
      const claimed = await this.outboxRepo.claimPendingOutbox(
        tx,
        CONCEPTS.OUTBOX_PENDING,
        now,
        batchSize,
      );

      const messages: RelayedMessageDto[] = [];
      let published = 0;
      let exhausted = 0;

      for (const message of claimed) {
        const attempts = (message.attempts ?? 0) + 1;
        message.attempts = attempts;
        message.lockedBy = dto.workerId;
        message.lockExpiresAt = new Date(now.getTime() + visibility * 1000);

        // Agotar los intentos lo saca de la rueda: sin estado terminal el relay
        // reintentaría el mismo mensaje para siempre.
        if (attempts > (message.maxAttempts ?? DEFAULT_MAX_ATTEMPTS)) {
          message.statusConceptId = CONCEPTS.OUTBOX_FAILED;
          message.lockedBy = undefined;
          message.lockExpiresAt = undefined;
          exhausted += 1;

          this.logger.warn(
            {
              operation: 'messaging.outbox.relay',
              outboxMessageId: message.id,
              attempts,
            },
            'Outbox message exhausted its attempts',
          );
        } else {
          message.statusConceptId = CONCEPTS.OUTBOX_PUBLISHED;
          message.publishedAt = now;
          message.lockedBy = undefined;
          message.lockExpiresAt = undefined;
          published += 1;
        }

        messages.push({
          id: message.id,
          domainEventId: message.domainEventId,
          idempotencyKey: message.idempotencyKey,
          statusConceptId: message.statusConceptId,
          attempts,
        });
      }

      this.logger.info(
        {
          operation: 'messaging.outbox.relay',
          workerId: dto.workerId,
          claimed: claimed.length,
          published,
          exhausted,
        },
        'Outbox relay batch processed',
      );

      return { claimed: claimed.length, published, exhausted, messages };
    });
  }

  /**
   * UC-35-03: repartir el evento entre sus suscriptores.
   *
   * El fan-out es idempotente por suscripción: reintentar el despacho no crea
   * una segunda entrega, porque un consumidor que recibiera el mismo evento dos
   * veces por culpa nuestra no tendría cómo distinguirlo.
   */
  async dispatchEvent(
    domainEventId: string,
    dto: DispatchEventDto,
    actor: AuthenticatedUser,
  ): Promise<DispatchEventResponseDto> {
    this.logger.info(
      { operation: 'messaging.event.dispatch', domainEventId },
      'Dispatching domain event to subscribers',
    );

    return this.em.transactional(async (tx) => {
      const event = await this.outboxRepo.findDomainEventById(
        tx,
        domainEventId,
      );
      if (!event) {
        throw new ResourceNotFoundException('Evento de dominio no encontrado', {
          domainEventId,
        });
      }

      const outbox = await this.outboxRepo.findOutboxByDomainEvent(
        tx,
        domainEventId,
      );
      // Repartir algo que el relay todavía no publicó adelantaría el evento a
      // consumidores que aún podrían ver deshecho el cambio que lo produjo.
      if (!outbox || outbox.statusConceptId !== CONCEPTS.OUTBOX_PUBLISHED) {
        throw new PreconditionFailedException(
          'El evento todavía no está publicado',
          {
            domainEventId,
          },
        );
      }

      // Span CONSUMER colgado del contexto que el productor guardó en la
      // metadata del evento: publicación y fan-out comparten `trace_id` aunque
      // los separen minutos y dos procesos. Un evento antiguo sin `_trace`
      // devuelve un carrier vacío y el span queda bajo la traza actual, sin
      // ninguna rama especial.
      return this.messagingTrace.runInConsumerSpan(
        'messaging.outbox process',
        {
          [APP_ATTR.MODULE]: 'messaging',
          [APP_ATTR.OPERATION]: 'event.dispatch',
          [APP_ATTR.EVENT_TYPE]: event.eventType,
          [APP_ATTR.EVENT_ID]: domainEventId,
          [APP_ATTR.TENANT_ID]: event.tenantId,
          'messaging.system': 'postgresql_outbox',
          'messaging.destination.name': 'messaging.outbox_messages',
          'messaging.operation.type': 'process',
        },
        this.messagingTrace.extract(event.metadataJson),
        (span) =>
          this.fanOutToSubscribers(tx, event, dto, actor).then((result) => {
            span.setAttributes({
              [APP_ATTR.RESULT_COUNT]: result.matched,
              'messaging.outbox.filtered_out': result.filteredOut,
            });
            return result;
          }),
      );
    });
  }

  /**
   * Reparte un evento ya publicado entre sus suscripciones activas.
   *
   * Se separó de `dispatchEvent` al añadir el span consumidor; la lógica de
   * fan-out (filtro, idempotencia por suscripción, encolado) no cambió.
   */
  private async fanOutToSubscribers(
    tx: EntityManager,
    event: DomainEvents,
    dto: DispatchEventDto,
    actor: AuthenticatedUser,
  ): Promise<DispatchEventResponseDto> {
    const domainEventId = event.id;
    const subscriptions = await this.outboxRepo.findActiveSubscriptions(
      tx,
      event.eventType,
      event.eventVersion,
      CONCEPTS.STATE_ACTIVE,
      event.tenantId,
    );

    const deliveries: DispatchedSubscriberDto[] = [];
    let filteredOut = 0;

    for (const subscription of subscriptions) {
      if (!this.matchesFilter(subscription.filterJson, event.payloadJson)) {
        filteredOut += 1;
        continue;
      }

      const existing = await this.outboxRepo.findEventDelivery(
        tx,
        domainEventId,
        subscription.id,
      );
      if (existing) {
        deliveries.push({
          subscriptionId: subscription.id,
          subscriberCode: subscription.subscriberCode,
          deliveryId: existing.id,
          duplicate: true,
        });
        continue;
      }

      const delivery = this.outboxRepo.createEventDelivery(tx, {
        domainEventId,
        subscriptionId: subscription.id,
        statusConceptId: CONCEPTS.EVENT_DELIVERY_DISPATCHED,
        attemptNumber: 1,
        recordedByUserId: actor.id,
      });

      let jobId: string | undefined;
      const wantsJob = dto.enqueueJobs !== false;
      if (
        wantsJob &&
        subscription.deliveryModeConceptId ===
          CONCEPTS.MSG_DELIVERY_MODE_QUEUE &&
        subscription.targetQueue
      ) {
        jobId = await this.enqueueSubscriberJob(tx, subscription.targetQueue, {
          domainEventId,
          subscriptionId: subscription.id,
          subscriberCode: subscription.subscriberCode,
          eventType: event.eventType,
          tenantId: event.tenantId,
          payloadJson: event.payloadJson,
        });
      }

      deliveries.push({
        subscriptionId: subscription.id,
        subscriberCode: subscription.subscriberCode,
        deliveryId: delivery.id,
        jobId,
        duplicate: false,
      });
    }

    return {
      domainEventId,
      matched: deliveries.length,
      filteredOut,
      deliveries,
    };
  }

  /** UC-35-04: registrar el acuse del consumidor sobre una entrega. */
  async ackDelivery(
    deliveryId: string,
    dto: AckEventDeliveryDto,
  ): Promise<EventDeliveryResponseDto> {
    if (dto.outcome === 'FAILED' && !dto.errorText) {
      throw new PreconditionFailedException(
        'Un acuse fallido debe declarar qué falló',
        {
          deliveryId,
        },
      );
    }

    return this.em.transactional(async (tx) => {
      const delivery = await this.outboxRepo.findEventDeliveryForUpdate(
        tx,
        deliveryId,
      );
      if (!delivery) {
        throw new ResourceNotFoundException('Entrega no encontrada', {
          deliveryId,
        });
      }
      if (
        delivery.statusConceptId !== CONCEPTS.EVENT_DELIVERY_DISPATCHED &&
        delivery.statusConceptId !== CONCEPTS.EVENT_DELIVERY_RETRYING
      ) {
        throw new PreconditionFailedException('La entrega ya está resuelta', {
          deliveryId,
        });
      }

      const handledAt = new Date();
      delivery.statusConceptId =
        dto.outcome === 'HANDLED'
          ? CONCEPTS.EVENT_DELIVERY_HANDLED
          : CONCEPTS.EVENT_DELIVERY_FAILED;
      delivery.handledAt = handledAt;
      delivery.errorText = dto.errorText;

      if (dto.outcome === 'FAILED') {
        this.logger.warn(
          {
            operation: 'messaging.event.ack',
            deliveryId,
            errorText: dto.errorText,
          },
          'Subscriber reported a failed event delivery',
        );
      }

      return {
        id: deliveryId,
        statusConceptId: delivery.statusConceptId,
        handledAt: handledAt.toISOString(),
      };
    });
  }

  // --- Apoyo ---

  /**
   * Encola el trabajo del suscriptor en su cola destino, reutilizando la
   * deduplicación de la cola: el par (evento, suscripción) sólo se encola una
   * vez aunque el despacho se reintente.
   */
  private async enqueueSubscriberJob(
    tx: EntityManager,
    queueCode: string,
    payload: {
      /**
       * Identificador asociado a domain event.
       */
      domainEventId: string;
      /**
       * Identificador asociado a subscription.
       */
      subscriptionId: string;
      /**
       * Valor de subscriber code mantenido por la instancia.
       */
      subscriberCode: string;
      /**
       * Valor de event type mantenido por la instancia.
       */
      eventType: string;
      /**
       * Identificador asociado a tenant.
       */
      tenantId?: string;
      /**
       * Valor de payload json mantenido por la instancia.
       */
      payloadJson: unknown;
    },
  ): Promise<string | undefined> {
    const queue = await this.queuesRepo.findQueueByCode(tx, queueCode);
    if (!queue || queue.stateConceptId !== CONCEPTS.STATE_ACTIVE) {
      this.logger.warn(
        { operation: 'messaging.event.dispatch', queueCode },
        'Subscription targets a queue that is missing or inactive',
      );
      return undefined;
    }

    const dedupeKey = `evt:${payload.domainEventId}:${payload.subscriptionId}`;
    const already = await this.queuesRepo.findJobByDedupeKey(tx, dedupeKey);
    if (already) return already.id;

    return this.queuesRepo.createJob(tx, {
      queueId: queue.id,
      tenantId: payload.tenantId,
      jobType: `event:${payload.eventType}`,
      dedupeKey,
      priority: queue.defaultPriority ?? 5,
      payloadJson: {
        domainEventId: payload.domainEventId,
        subscriptionId: payload.subscriptionId,
        subscriberCode: payload.subscriberCode,
        event: payload.payloadJson,
      },
      statusConceptId: CONCEPTS.JOB_READY,
      availableAt: new Date(),
      maxAttempts: queue.defaultMaxAttempts ?? DEFAULT_MAX_ATTEMPTS,
    }).id;
  }

  /**
   * El filtro de la suscripción es una comparación de igualdad campo a campo
   * contra el payload del evento. El caso de uso no declara nada más rico y no
   * se inventa un lenguaje de expresiones; sin filtro, la suscripción recibe
   * todo lo de su tipo.
   */
  private matchesFilter(filterJson: unknown, payload: unknown): boolean {
    if (filterJson === undefined || filterJson === null) return true;
    if (typeof filterJson !== 'object' || Array.isArray(filterJson))
      return false;
    if (payload === null || typeof payload !== 'object') return false;

    const source = payload as Record<string, unknown>;
    return Object.entries(filterJson as Record<string, unknown>).every(
      ([key, expected]) => String(source[key]) === String(expected),
    );
  }

  /**
   * Clave derivada del contenido del hecho. Dos publicaciones del mismo evento
   * sobre el mismo agregado producen la misma clave, que es justo lo que evita
   * el duplicado cuando el llamante reintenta.
   */
  private deriveIdempotencyKey(
    eventType: string,
    eventVersion: number,
    aggregateId: string,
    payload: unknown,
  ): string {
    const digest = createHash('sha256')
      .update(
        `${eventType}:${eventVersion}:${aggregateId}:${JSON.stringify(payload)}`,
      )
      .digest('hex')
      .slice(0, 32);

    return `${eventType}:${aggregateId}:${digest}`;
  }

  /** Backoff exponencial con techo, para que un fallo persistente no ahogue la cola. */
  static backoffSeconds(attempts: number): number {
    return Math.min(
      BACKOFF_BASE_SECONDS * 2 ** Math.max(0, attempts - 1),
      BACKOFF_CAP_SECONDS,
    );
  }
}
