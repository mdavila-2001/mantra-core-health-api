import type { UnitOfWork } from './unit-of-work';

/** Un hecho de agenda por publicar en el outbox. */
export interface SchedulingDomainEventInput {
  tenantId?: string;
  eventType: string;
  eventVersion?: number;
  aggregateType: string;
  aggregateId: string;
  payloadJson: Record<string, unknown>;
  metadataJson?: Record<string, unknown>;
  correlationId?: string;
  causationId?: string;
  occurredAt?: Date;
  idempotencyKey?: string;
  maxAttempts?: number;
  actorUserId?: string;
}

/**
 * Publicación de hechos de agenda en la unidad de trabajo activa: el hecho queda en la
 * misma transacción que el cambio que lo origina.
 */
export interface DomainEventPublisherPort {
  publish(uow: UnitOfWork, input: SchedulingDomainEventInput): Promise<void>;
}

/** Token de inyección del publicador de eventos de dominio. */
export const DOMAIN_EVENT_PUBLISHER_PORT = Symbol(
  'SCHEDULING_DOMAIN_EVENT_PUBLISHER_PORT',
);
