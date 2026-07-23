import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'rule_executions' })
export class RuleExecutions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'automated_rule_id', type: 'uuid' }) // FK → ads.automated_rules
  automatedRuleId!: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'entities_evaluated',
    columnType: 'int',
    nullable: true,
  })
  entitiesEvaluated?: number;

  @Property({
    fieldName: 'entities_affected',
    columnType: 'int',
    nullable: true,
  })
  entitiesAffected?: number;

  @Property({
    fieldName: 'actions_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  actionsJson?: unknown;

  @Property({ fieldName: 'error_text', columnType: 'text', nullable: true })
  errorText?: string;

  @Property({
    fieldName: 'evaluated_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  evaluatedAt?: Date;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
