import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'automated_rules' })
export class AutomatedRules {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'ad_account_id', type: 'uuid' }) // FK → ads.ad_accounts
  adAccountId!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'scope_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  scopeConceptId!: string;

  @Property({
    fieldName: 'entity_filter_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  entityFilterJson?: unknown;

  @Property({ fieldName: 'condition_json', type: 'json', columnType: 'jsonb' })
  conditionJson!: unknown;

  @Property({ fieldName: 'action_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  actionConceptId!: string;

  @Property({
    fieldName: 'action_params_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  actionParamsJson?: unknown;

  @Property({ fieldName: 'evaluation_schedule_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  evaluationScheduleConceptId!: string;

  @Property({ fieldName: 'is_enabled', type: 'boolean', nullable: true })
  isEnabled?: boolean;

  @Property({
    fieldName: 'last_evaluated_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastEvaluatedAt?: Date;

  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

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
