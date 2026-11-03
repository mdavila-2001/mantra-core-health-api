import type { EntityManager } from '@mikro-orm/postgresql';

export interface ClaimDecisionEvent {
  readonly tenantId: string;
  readonly eventType: string;
  readonly aggregateType: string;
  readonly aggregateId: string;
  readonly payloadJson: Record<string, unknown>;
}

export interface ClaimDecisionPublisherPort {
  publish(tx: EntityManager, event: ClaimDecisionEvent): Promise<void>;
}

export const CLAIM_DECISION_PUBLISHER_PORT = Symbol(
  'CLAIM_DECISION_PUBLISHER_PORT',
);
