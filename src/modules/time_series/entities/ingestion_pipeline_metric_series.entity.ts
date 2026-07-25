import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity({
  schema: 'time_series',
  tableName: 'ingestion_pipeline_metric_series',
})
export class IngestionPipelineMetricSeries {
  @PrimaryKey({ columnType: 'timestamptz' })
  time!: Date;

  @PrimaryKey({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @PrimaryKey({ fieldName: 'series_id', columnType: 'varchar' })
  seriesId!: string;

  @Property({ fieldName: 'ingestion_id', type: 'uuid' })
  ingestionId!: string;

  @Property({ fieldName: 'source_version', columnType: 'varchar' })
  sourceVersion!: string;

  @Property({ fieldName: 'quality_state', columnType: 'varchar' })
  qualityState!: string;

  @Property({ fieldName: 'pipeline_code', columnType: 'varchar' })
  pipelineCode!: string;

  @Property({ fieldName: 'batch_id', type: 'uuid' })
  batchId!: string;

  @Property({ fieldName: 'stage_code', columnType: 'varchar' })
  stageCode!: string;

  @Property({ fieldName: 'metric_code', columnType: 'varchar' })
  metricCode!: string;

  @Property({ fieldName: 'metric_value', columnType: 'double precision' })
  metricValue!: number;

  @Property({ type: 'json', columnType: 'jsonb', nullable: true })
  details?: unknown;
}
