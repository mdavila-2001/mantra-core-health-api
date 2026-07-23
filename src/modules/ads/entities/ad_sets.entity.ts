import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'ad_sets' })
export class AdSets {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'campaign_id', type: 'uuid' }) // FK → ads.campaigns
  campaignId!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'optimization_goal_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  optimizationGoalConceptId!: string;

  @Property({ fieldName: 'billing_event_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  billingEventConceptId!: string;

  @Property({ fieldName: 'bid_amount', columnType: 'numeric', nullable: true })
  bidAmount?: string;

  @Property({
    fieldName: 'bid_strategy_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  bidStrategyConceptId?: string;

  @Property({
    fieldName: 'daily_budget',
    columnType: 'numeric',
    nullable: true,
  })
  dailyBudget?: string;

  @Property({
    fieldName: 'lifetime_budget',
    columnType: 'numeric',
    nullable: true,
  })
  lifetimeBudget?: string;

  @Property({ fieldName: 'targeting_spec_id', type: 'uuid', nullable: true }) // FK → ads.targeting_specs
  targetingSpecId?: string;

  @Property({
    fieldName: 'promoted_object_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  promotedObjectJson?: unknown;

  @Property({
    fieldName: 'pacing_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  pacingTypeConceptId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'effective_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  effectiveStatusConceptId?: string;

  @Property({
    fieldName: 'start_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startAt?: Date;

  @Property({ fieldName: 'end_at', columnType: 'timestamptz', nullable: true })
  endAt?: Date;

  @Property({
    fieldName: 'external_adset_ref',
    columnType: 'varchar',
    nullable: true,
  })
  externalAdsetRef?: string;

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
