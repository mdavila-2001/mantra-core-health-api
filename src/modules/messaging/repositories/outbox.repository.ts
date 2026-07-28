import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  DomainEvents,
  OutboxMessages,
  EventSubscriptions,
  EventDeliveries,
} from '../entities';

/**
 * Describe el contrato estructural de create domain event data.
 */
export interface CreateDomainEventData {
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
  eventVersion: number;
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
  payloadJson: unknown;
  /**
   * Valor de metadata json mantenido por la instancia.
   */
  metadataJson?: unknown;
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
  /**
   * Identificador asociado a recorded by user.
   */
  recordedByUserId?: string;
}

/**
 * Describe el contrato estructural de create outbox message data.
 */
export interface CreateOutboxMessageData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId?: string;
  /**
   * Identificador asociado a domain event.
   */
  domainEventId: string;
  /**
   * Valor de aggregate type mantenido por la instancia.
   */
  aggregateType: string;
  /**
   * Identificador asociado a aggregate.
   */
  aggregateId: string;
  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  idempotencyKey: string;
  /**
   * Valor de payload json mantenido por la instancia.
   */
  payloadJson: unknown;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de max attempts mantenido por la instancia.
   */
  maxAttempts: number;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso al outbox de `messaging.*`: eventos de dominio, mensajes de salida,
 * suscripciones y entregas a suscriptores.
 */
@Injectable()
export class OutboxRepository {
  // --- Eventos de dominio (UC-35-01) ---

  /** Log inmutable: el evento es lo que pasó, y no se reescribe. */
  createDomainEvent(
    em: EntityManager,
    data: CreateDomainEventData,
  ): DomainEvents {
    return em.create(
      DomainEvents,
      {
        tenantId: data.tenantId,
        eventType: data.eventType,
        eventVersion: data.eventVersion,
        aggregateType: data.aggregateType,
        aggregateId: data.aggregateId,
        payloadJson: data.payloadJson,
        metadataJson: data.metadataJson,
        correlationId: data.correlationId,
        causationId: data.causationId,
        occurredAt: data.occurredAt ?? new Date(),
        recordedAt: new Date(),
        recordedByUserId: data.recordedByUserId,
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find domain event by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find domain event by id conforme al contrato `Promise<DomainEvents | null>`.
   */
  findDomainEventById(
    em: EntityManager,
    id: string,
  ): Promise<DomainEvents | null> {
    return em.findOne(DomainEvents, { id });
  }

  // --- Mensajes de outbox (UC-35-01, 02) ---

  /**
   * Crea create outbox message.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create outbox message conforme al contrato `OutboxMessages`.
   */
  createOutboxMessage(
    em: EntityManager,
    data: CreateOutboxMessageData,
  ): OutboxMessages {
    return em.create(
      OutboxMessages,
      {
        tenantId: data.tenantId,
        domainEventId: data.domainEventId,
        aggregateType: data.aggregateType,
        aggregateId: data.aggregateId,
        idempotencyKey: data.idempotencyKey,
        payloadJson: data.payloadJson,
        statusConceptId: data.statusConceptId,
        availableAt: new Date(),
        attempts: 0,
        maxAttempts: data.maxAttempts,
      },
      { partial: true },
    );
  }

  /** La clave de idempotencia es lo que impide publicar dos veces el mismo hecho. */
  findOutboxByIdempotencyKey(
    em: EntityManager,
    idempotencyKey: string,
  ): Promise<OutboxMessages | null> {
    return em.findOne(OutboxMessages, { idempotencyKey });
  }

  /**
   * Obtiene find outbox by domain event.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param domainEventId - Identificador de domain event.
   * @returns Resultado de find outbox by domain event conforme al contrato `Promise<OutboxMessages | null>`.
   */
  findOutboxByDomainEvent(
    em: EntityManager,
    domainEventId: string,
  ): Promise<OutboxMessages | null> {
    return em.findOne(OutboxMessages, { domainEventId });
  }

  /**
   * Lote de mensajes reclamables: pendientes, disponibles y sin lock vivo.
   *
   * `SKIP LOCKED` es lo que permite correr varios relays a la vez sin que se
   * estorben: cada uno se lleva un lote distinto en lugar de esperar al otro.
   */
  claimPendingOutbox(
    em: EntityManager,
    pendingStatusConceptId: string,
    now: Date,
    limit: number,
  ): Promise<OutboxMessages[]> {
    return em.find(
      OutboxMessages,
      {
        statusConceptId: pendingStatusConceptId,
        availableAt: { $lte: now },
        $or: [{ lockExpiresAt: null }, { lockExpiresAt: { $lte: now } }],
      },
      {
        lockMode: LockMode.PESSIMISTIC_PARTIAL_WRITE,
        orderBy: { availableAt: 'ASC' },
        limit,
      },
    );
  }

  // --- Suscripciones y entregas (UC-35-03, 04) ---

  /** Suscripciones vivas que casan con el tipo y la versión del evento. */
  findActiveSubscriptions(
    em: EntityManager,
    eventType: string,
    eventVersion: number,
    activeStateConceptId: string,
  ): Promise<EventSubscriptions[]> {
    return em.find(EventSubscriptions, {
      eventType,
      eventVersion,
      isActive: true,
      stateConceptId: activeStateConceptId,
    });
  }

  /**
   * Crea create event delivery.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create event delivery conforme al contrato `EventDeliveries`.
   */
  createEventDelivery(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a domain event.
       */
      domainEventId: string;
      /**
       * Identificador asociado a subscription.
       */
      subscriptionId: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Valor de attempt number mantenido por la instancia.
       */
      attemptNumber: number;
      /**
       * Identificador asociado a recorded by user.
       */
      recordedByUserId?: string;
    },
  ): EventDeliveries {
    return em.create(
      EventDeliveries,
      {
        domainEventId: data.domainEventId,
        subscriptionId: data.subscriptionId,
        statusConceptId: data.statusConceptId,
        attemptNumber: data.attemptNumber,
        recordedAt: new Date(),
        recordedByUserId: data.recordedByUserId,
      },
      { partial: true },
    );
  }

  /** Entrega ya emitida para esa suscripción: hace idempotente el fan-out. */
  findEventDelivery(
    em: EntityManager,
    domainEventId: string,
    subscriptionId: string,
  ): Promise<EventDeliveries | null> {
    return em.findOne(EventDeliveries, { domainEventId, subscriptionId });
  }

  /**
   * Obtiene find event delivery for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find event delivery for update conforme al contrato `Promise<EventDeliveries | null>`.
   */
  findEventDeliveryForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<EventDeliveries | null> {
    return em.findOne(
      EventDeliveries,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }
}
