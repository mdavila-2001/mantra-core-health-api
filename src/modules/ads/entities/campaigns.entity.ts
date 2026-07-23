import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'campaigns' })
export class Campaigns {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'ad_account_id', type: 'uuid' }) // FK → ads.ad_accounts
  adAccountId!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'objective_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  objectiveConceptId!: string;

  @Property({ fieldName: 'buying_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  buyingTypeConceptId!: string;

  @Property({
    fieldName: 'special_ad_categories_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  specialAdCategoriesJson?: unknown;

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

  @Property({ fieldName: 'spend_cap', columnType: 'numeric', nullable: true })
  spendCap?: string;

  @Property({
    fieldName: 'bid_strategy_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  bidStrategyConceptId?: string;

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

  @Property({ fieldName: 'stop_at', columnType: 'timestamptz', nullable: true })
  stopAt?: Date;

  @Property({
    fieldName: 'external_campaign_ref',
    columnType: 'varchar',
    nullable: true,
  })
  externalCampaignRef?: string;

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
