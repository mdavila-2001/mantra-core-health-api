import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'dataset_quality_snapshots' })
export class DatasetQualitySnapshots {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'conversion_dataset_id', type: 'uuid' }) // FK → ads.conversion_datasets
  conversionDatasetId!: string;

  @Property({ fieldName: 'measured_at', columnType: 'timestamptz' })
  measuredAt!: Date;

  @Property({
    fieldName: 'event_match_quality_score',
    columnType: 'numeric(8,4)',
    nullable: true,
  })
  eventMatchQualityScore?: string;

  @Property({
    fieldName: 'deduplicated_event_percent',
    columnType: 'numeric(8,4)',
    nullable: true,
  })
  deduplicatedEventPercent?: string;

  @Property({
    fieldName: 'rejected_event_percent',
    columnType: 'numeric(8,4)',
    nullable: true,
  })
  rejectedEventPercent?: string;

  @Property({ fieldName: 'freshness_seconds', type: 'bigint', nullable: true })
  freshnessSeconds?: string;

  @Property({
    fieldName: 'diagnostics_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  diagnosticsJson?: unknown;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
