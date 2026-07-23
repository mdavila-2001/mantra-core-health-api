import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'insights_daily' })
export class InsightsDaily {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'ad_account_id', type: 'uuid' }) // FK → ads.ad_accounts
  adAccountId!: string;

  @Property({ fieldName: 'entity_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  entityTypeConceptId!: string;

  @Property({ fieldName: 'entity_ref_id', type: 'uuid' })
  entityRefId!: string;

  @Property({ fieldName: 'stat_date', columnType: 'date' })
  statDate!: Date;

  @Property({ type: 'bigint', nullable: true })
  impressions?: string;

  @Property({ type: 'bigint', nullable: true })
  reach?: string;

  @Property({ type: 'bigint', nullable: true })
  clicks?: string;

  @Property({ fieldName: 'unique_clicks', type: 'bigint', nullable: true })
  uniqueClicks?: string;

  @Property({ columnType: 'numeric', nullable: true })
  spend?: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  @Property({ type: 'bigint', nullable: true })
  conversions?: string;

  @Property({
    fieldName: 'conversion_value',
    columnType: 'numeric',
    nullable: true,
  })
  conversionValue?: string;

  @Property({ columnType: 'numeric', nullable: true })
  ctr?: string;

  @Property({ columnType: 'numeric', nullable: true })
  cpc?: string;

  @Property({ columnType: 'numeric', nullable: true })
  cpm?: string;

  @Property({ columnType: 'numeric', nullable: true })
  frequency?: string;

  @Property({ fieldName: 'video_views', type: 'bigint', nullable: true })
  videoViews?: string;

  @Property({
    fieldName: 'breakdown_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  breakdownJson?: unknown;

  @Property({ fieldName: 'source_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  sourceConceptId?: string;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
