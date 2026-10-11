import type { UnitOfWork } from './unit-of-work';

export interface PharmacyDomainEventInput {
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

/** Publicación de hechos de farmacia en la unidad de trabajo activa. */
export interface DomainEventPublisherPort {
  publish(uow: UnitOfWork, input: PharmacyDomainEventInput): Promise<void>;
}

/** Token de inyección del publicador de eventos de dominio. */
export const DOMAIN_EVENT_PUBLISHER_PORT = Symbol(
  'DOMAIN_EVENT_PUBLISHER_PORT',
);
