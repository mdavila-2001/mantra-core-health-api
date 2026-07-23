import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'workflow', tableName: 'transition_side_effects' })
export class TransitionSideEffects {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'state_transition_definition_id', type: 'uuid' }) // FK → workflow.state_transition_definitions
  stateTransitionDefinitionId!: string;

  @Property({ fieldName: 'side_effect_code', columnType: 'varchar' })
  sideEffectCode!: string;

  @Property({ fieldName: 'side_effect_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  sideEffectTypeConceptId!: string;

  @Property({ fieldName: 'execution_mode_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  executionModeConceptId!: string;

  @Property({ fieldName: 'execution_order', columnType: 'int' })
  executionOrder!: number;

  @Property({
    fieldName: 'outbox_event_type',
    columnType: 'varchar',
    nullable: true,
  })
  outboxEventType?: string;

  @Property({
    fieldName: 'action_spec_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  actionSpecJson?: unknown;

  @Property({
    fieldName: 'compensation_spec_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  compensationSpecJson?: unknown;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
