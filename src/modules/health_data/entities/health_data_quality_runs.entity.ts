import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `health_data_quality_runs`.
 */
@Entity({ schema: 'health_data', tableName: 'health_data_quality_runs' })
export class HealthDataQualityRuns {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /**
   * Identificador asociado a health data quality rule set.
   */
  @Property({ fieldName: 'health_data_quality_rule_set_id', type: 'uuid' }) // FK → health_data.health_data_quality_rule_sets
  healthDataQualityRuleSetId!: string;

  /**
   * Identificador asociado a health ingestion batch.
   */
  @Property({
    fieldName: 'health_ingestion_batch_id',
    type: 'uuid',
    nullable: true,
  }) // FK → health_data.health_ingestion_batches
  healthIngestionBatchId?: string;

  /**
   * Identificador asociado a canonical resource.
   */
  @Property({
    fieldName: 'canonical_resource_id',
    type: 'uuid',
    nullable: true,
  }) // FK → health_data.canonical_health_resources
  canonicalResourceId?: string;

  /**
   * Valor de started at mantenido por la instancia.
   */
  @Property({ fieldName: 'started_at', columnType: 'timestamptz' })
  startedAt!: Date;

  /**
   * Valor de completed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  completedAt?: Date;

  /**
   * Identificador asociado a result concept.
   */
  @Property({ fieldName: 'result_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  resultConceptId!: string;

  /**
   * Valor de records evaluated mantenido por la instancia.
   */
  @Property({ fieldName: 'records_evaluated', type: 'bigint', nullable: true })
  recordsEvaluated?: string;

  /**
   * Valor de issues detected mantenido por la instancia.
   */
  @Property({ fieldName: 'issues_detected', type: 'bigint', nullable: true })
  issuesDetected?: string;

  /**
   * Valor de summary json mantenido por la instancia.
   */
  @Property({
    fieldName: 'summary_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  summaryJson?: unknown;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
