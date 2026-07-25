import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity({ schema: 'time_series', tableName: 'ai_runtime_metric_series' })
export class AiRuntimeMetricSeries {
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

  @Property({ fieldName: 'agent_id', type: 'uuid' })
  agentId!: string;

  @Property({ fieldName: 'execution_id', type: 'uuid' })
  executionId!: string;

  @Property({ fieldName: 'model_provider', columnType: 'varchar' })
  modelProvider!: string;

  @Property({ fieldName: 'model_id', columnType: 'varchar' })
  modelId!: string;

  @Property({ fieldName: 'metric_code', columnType: 'varchar' })
  metricCode!: string;

  @Property({ fieldName: 'metric_value', columnType: 'double precision' })
  metricValue!: number;

  @Property({ type: 'json', columnType: 'jsonb', nullable: true })
  dimensions?: unknown;
}
