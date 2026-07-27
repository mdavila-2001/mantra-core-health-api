import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  DomainEvents,
  OutboxMessages,
  EventSubscriptions,
  EventDeliveries,
} from '../entities';

export interface CreateDomainEventData {
  tenantId?: string;
  eventType: string;
  eventVersion: number;
  aggregateType: string;
  aggregateId: string;
  payloadJson: unknown;
  metadataJson?: unknown;
  correlationId?: string;
  causationId?: string;
  occurredAt?: Date;
  recordedByUserId?: string;
}

export interface CreateOutboxMessageData {
  tenantId?: string;
  domainEventId: string;
  aggregateType: string;
  aggregateId: string;
  idempotencyKey: string;
  payloadJson: unknown;
  statusConceptId: string;
  maxAttempts: number;
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

  findDomainEventById(
    em: EntityManager,
    id: string,
  ): Promise<DomainEvents | null> {
    return em.findOne(DomainEvents, { id });
  }

  // --- Mensajes de outbox (UC-35-01, 02) ---

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

  createEventDelivery(
    em: EntityManager,
    data: {
      domainEventId: string;
      subscriptionId: string;
      statusConceptId: string;
      attemptNumber: number;
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
