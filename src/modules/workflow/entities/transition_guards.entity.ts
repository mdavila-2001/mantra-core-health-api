import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'workflow', tableName: 'transition_guards' })
export class TransitionGuards {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'state_transition_definition_id', type: 'uuid' }) // FK → workflow.state_transition_definitions
  stateTransitionDefinitionId!: string;

  @Property({ fieldName: 'guard_code', columnType: 'varchar' })
  guardCode!: string;

  @Property({ fieldName: 'guard_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  guardTypeConceptId!: string;

  @Property({ fieldName: 'evaluation_order', columnType: 'int' })
  evaluationOrder!: number;

  @Property({
    fieldName: 'expression_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  expressionJson?: unknown;

  @Property({
    fieldName: 'failure_code',
    columnType: 'varchar',
    nullable: true,
  })
  failureCode?: string;

  @Property({
    fieldName: 'failure_message_key',
    columnType: 'varchar',
    nullable: true,
  })
  failureMessageKey?: string;

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
