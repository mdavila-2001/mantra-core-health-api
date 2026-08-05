import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `state_transition_events`.
 */
@Entity({ schema: 'workflow', tableName: 'state_transition_events' })
export class StateTransitionEvents {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a state machine definition.
   */
  @Property({ fieldName: 'state_machine_definition_id', type: 'uuid' }) // FK → workflow.state_machine_definitions
  stateMachineDefinitionId!: string;

  /**
   * Identificador asociado a transition definition.
   */
  @Property({ fieldName: 'transition_definition_id', type: 'uuid' }) // FK → workflow.state_transition_definitions
  transitionDefinitionId!: string;

  /**
   * Identificador asociado a aggregate.
   */
  @Property({ fieldName: 'aggregate_id', type: 'uuid' })
  aggregateId!: string;

  /**
   * Identificador asociado a from state concept.
   */
  @Property({ fieldName: 'from_state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  fromStateConceptId!: string;

  /**
   * Identificador asociado a to state concept.
   */
  @Property({ fieldName: 'to_state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  toStateConceptId!: string;

  /**
   * Identificador asociado a actor user.
   */
  @Property({ fieldName: 'actor_user_id', type: 'uuid' }) // FK → iam.users
  actorUserId!: string;

  /**
   * Identificador asociado a actor tenant.
   */
  @Property({ fieldName: 'actor_tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  actorTenantId?: string;

  /**
   * Identificador asociado a reason concept.
   */
  @Property({ fieldName: 'reason_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  reasonConceptId?: string;

  /**
   * Valor de reason text mantenido por la instancia.
   */
  @Property({ fieldName: 'reason_text', columnType: 'text', nullable: true })
  reasonText?: string;

  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  @Property({
    fieldName: 'idempotency_key',
    columnType: 'varchar',
    nullable: true,
  })
  idempotencyKey?: string;

  /**
   * Identificador asociado a correlation.
   */
  @Property({ fieldName: 'correlation_id', type: 'uuid', nullable: true })
  correlationId?: string;

  /**
   * Identificador asociado a causation.
   */
  @Property({ fieldName: 'causation_id', type: 'uuid', nullable: true })
  causationId?: string;

  /**
   * Valor de aggregate row version before mantenido por la instancia.
   */
  @Property({
    fieldName: 'aggregate_row_version_before',
    columnType: 'int',
    nullable: true,
  })
  aggregateRowVersionBefore?: number;

  /**
   * Valor de aggregate row version after mantenido por la instancia.
   */
  @Property({
    fieldName: 'aggregate_row_version_after',
    columnType: 'int',
    nullable: true,
  })
  aggregateRowVersionAfter?: number;

  /**
   * Valor de occurred at mantenido por la instancia.
   */
  @Property({ fieldName: 'occurred_at', columnType: 'timestamptz' })
  occurredAt!: Date;
}
