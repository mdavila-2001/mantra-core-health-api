import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

/**
 * Mapea la entidad persistente asociada a `ai_runtime_metric_series`.
 */
@Entity({ schema: 'time_series', tableName: 'ai_runtime_metric_series' })
export class AiRuntimeMetricSeries {
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
   * Identificador asociado a agent.
   */
  @Property({ fieldName: 'agent_id', type: 'uuid' })
  agentId!: string;

  /**
   * Identificador asociado a execution.
   */
  @Property({ fieldName: 'execution_id', type: 'uuid' })
  executionId!: string;

  /**
   * Valor de model provider mantenido por la instancia.
   */
  @Property({ fieldName: 'model_provider', columnType: 'varchar' })
  modelProvider!: string;

  /**
   * Identificador asociado a model.
   */
  @Property({ fieldName: 'model_id', columnType: 'varchar' })
  modelId!: string;

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
   * Valor de dimensions mantenido por la instancia.
   */
  @Property({ type: 'json', columnType: 'jsonb', nullable: true })
  dimensions?: unknown;
}
