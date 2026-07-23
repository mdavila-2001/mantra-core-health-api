import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'insight_fact_rows' })
export class InsightFactRows {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'insight_query_run_id', type: 'uuid' }) // FK → ads.insight_query_runs
  insightQueryRunId!: string;

  @Property({ fieldName: 'fact_date', columnType: 'date' })
  factDate!: Date;

  @Property({ fieldName: 'object_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  objectTypeConceptId!: string;

  @Property({ fieldName: 'external_object_id', columnType: 'varchar' })
  externalObjectId!: string;

  @Property({ fieldName: 'campaign_id', type: 'uuid', nullable: true }) // FK → ads.campaigns
  campaignId?: string;

  @Property({ fieldName: 'ad_set_id', type: 'uuid', nullable: true }) // FK → ads.ad_sets
  adSetId?: string;

  @Property({ fieldName: 'ad_id', type: 'uuid', nullable: true }) // FK → ads.ads
  adId?: string;

  @Property({
    fieldName: 'dimensions_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  dimensionsJson?: unknown;

  @Property({ fieldName: 'metrics_json', type: 'json', columnType: 'jsonb' })
  metricsJson!: unknown;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
