import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'workflow', tableName: 'state_transition_events' })
export class StateTransitionEvents {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'state_machine_definition_id', type: 'uuid' }) // FK → workflow.state_machine_definitions
  stateMachineDefinitionId!: string;

  @Property({ fieldName: 'transition_definition_id', type: 'uuid' }) // FK → workflow.state_transition_definitions
  transitionDefinitionId!: string;

  @Property({ fieldName: 'aggregate_id', type: 'uuid' })
  aggregateId!: string;

  @Property({ fieldName: 'from_state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  fromStateConceptId!: string;

  @Property({ fieldName: 'to_state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  toStateConceptId!: string;

  @Property({ fieldName: 'actor_user_id', type: 'uuid' }) // FK → iam.users
  actorUserId!: string;

  @Property({ fieldName: 'actor_tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  actorTenantId?: string;

  @Property({ fieldName: 'reason_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  reasonConceptId?: string;

  @Property({ fieldName: 'reason_text', columnType: 'text', nullable: true })
  reasonText?: string;

  @Property({
    fieldName: 'idempotency_key',
    columnType: 'varchar',
    nullable: true,
  })
  idempotencyKey?: string;

  @Property({ fieldName: 'correlation_id', type: 'uuid', nullable: true })
  correlationId?: string;

  @Property({ fieldName: 'causation_id', type: 'uuid', nullable: true })
  causationId?: string;

  @Property({
    fieldName: 'aggregate_row_version_before',
    columnType: 'int',
    nullable: true,
  })
  aggregateRowVersionBefore?: number;

  @Property({
    fieldName: 'aggregate_row_version_after',
    columnType: 'int',
    nullable: true,
  })
  aggregateRowVersionAfter?: number;

  @Property({ fieldName: 'occurred_at', columnType: 'timestamptz' })
  occurredAt!: Date;
}
