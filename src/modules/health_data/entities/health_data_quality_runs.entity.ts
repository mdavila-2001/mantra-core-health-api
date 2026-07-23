import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'health_data', tableName: 'health_data_quality_runs' })
export class HealthDataQualityRuns {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'health_data_quality_rule_set_id', type: 'uuid' }) // FK → health_data.health_data_quality_rule_sets
  healthDataQualityRuleSetId!: string;

  @Property({
    fieldName: 'health_ingestion_batch_id',
    type: 'uuid',
    nullable: true,
  }) // FK → health_data.health_ingestion_batches
  healthIngestionBatchId?: string;

  @Property({
    fieldName: 'canonical_resource_id',
    type: 'uuid',
    nullable: true,
  }) // FK (destino no resuelto)
  canonicalResourceId?: string;

  @Property({ fieldName: 'started_at', columnType: 'timestamptz' })
  startedAt!: Date;

  @Property({
    fieldName: 'completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  completedAt?: Date;

  @Property({ fieldName: 'result_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  resultConceptId!: string;

  @Property({ fieldName: 'records_evaluated', type: 'bigint', nullable: true })
  recordsEvaluated?: string;

  @Property({ fieldName: 'issues_detected', type: 'bigint', nullable: true })
  issuesDetected?: string;

  @Property({
    fieldName: 'summary_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  summaryJson?: unknown;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
