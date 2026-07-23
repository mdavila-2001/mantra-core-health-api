import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'health_data', tableName: 'omop_transformation_runs' })
export class OmopTransformationRuns {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'omop_mapping_set_id', type: 'uuid' }) // FK → health_data.omop_mapping_sets
  omopMappingSetId!: string;

  @Property({
    fieldName: 'health_ingestion_batch_id',
    type: 'uuid',
    nullable: true,
  }) // FK → health_data.health_ingestion_batches
  healthIngestionBatchId?: string;

  @Property({ fieldName: 'started_at', columnType: 'timestamptz' })
  startedAt!: Date;

  @Property({
    fieldName: 'completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  completedAt?: Date;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'records_read', type: 'bigint', nullable: true })
  recordsRead?: string;

  @Property({ fieldName: 'records_written', type: 'bigint', nullable: true })
  recordsWritten?: string;

  @Property({ fieldName: 'records_rejected', type: 'bigint', nullable: true })
  recordsRejected?: string;

  @Property({
    fieldName: 'quality_summary_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  qualitySummaryJson?: unknown;

  @Property({ fieldName: 'lineage_job_run_id', type: 'uuid', nullable: true })
  lineageJobRunId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
