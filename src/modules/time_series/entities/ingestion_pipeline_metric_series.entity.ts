import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

/**
 * Mapea la entidad persistente asociada a `ingestion_pipeline_metric_series`.
 */
@Entity({
  schema: 'time_series',
  tableName: 'ingestion_pipeline_metric_series',
})
export class IngestionPipelineMetricSeries {
  /**
   * Valor de time mantenido por la instancia.
   */
  @PrimaryKey({ columnType: 'timestamptz' })
  time!: Date;

  /**
   * Identificador asociado a tenant.
   */
  @PrimaryKey({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  /**
   * Identificador asociado a series.
   */
  @PrimaryKey({ fieldName: 'series_id', columnType: 'varchar' })
  seriesId!: string;

  /**
   * Identificador asociado a ingestion.
   */
  @Property({ fieldName: 'ingestion_id', type: 'uuid' })
  ingestionId!: string;

  /**
   * Valor de source version mantenido por la instancia.
   */
  @Property({ fieldName: 'source_version', columnType: 'varchar' })
  sourceVersion!: string;

  /**
   * Valor de quality state mantenido por la instancia.
   */
  @Property({ fieldName: 'quality_state', columnType: 'varchar' })
  qualityState!: string;

  /**
   * Valor de pipeline code mantenido por la instancia.
   */
  @Property({ fieldName: 'pipeline_code', columnType: 'varchar' })
  pipelineCode!: string;

  /**
   * Identificador asociado a batch.
   */
  @Property({ fieldName: 'batch_id', type: 'uuid' })
  batchId!: string;

  /**
   * Valor de stage code mantenido por la instancia.
   */
  @Property({ fieldName: 'stage_code', columnType: 'varchar' })
  stageCode!: string;

  /**
   * Valor de metric code mantenido por la instancia.
   */
  @Property({ fieldName: 'metric_code', columnType: 'varchar' })
  metricCode!: string;

  /**
   * Valor de metric value mantenido por la instancia.
   */
  @Property({ fieldName: 'metric_value', columnType: 'double precision' })
  metricValue!: number;

  /**
   * Valor de details mantenido por la instancia.
   */
  @Property({ type: 'json', columnType: 'jsonb', nullable: true })
  details?: unknown;
}
