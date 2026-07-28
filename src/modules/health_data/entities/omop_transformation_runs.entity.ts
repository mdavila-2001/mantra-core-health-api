import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `omop_transformation_runs`.
 */
@Entity({ schema: 'health_data', tableName: 'omop_transformation_runs' })
export class OmopTransformationRuns {
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
   * Identificador asociado a omop mapping set.
   */
  @Property({ fieldName: 'omop_mapping_set_id', type: 'uuid' }) // FK → health_data.omop_mapping_sets
  omopMappingSetId!: string;

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
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de records read mantenido por la instancia.
   */
  @Property({ fieldName: 'records_read', type: 'bigint', nullable: true })
  recordsRead?: string;

  /**
   * Valor de records written mantenido por la instancia.
   */
  @Property({ fieldName: 'records_written', type: 'bigint', nullable: true })
  recordsWritten?: string;

  /**
   * Valor de records rejected mantenido por la instancia.
   */
  @Property({ fieldName: 'records_rejected', type: 'bigint', nullable: true })
  recordsRejected?: string;

  /**
   * Valor de quality summary json mantenido por la instancia.
   */
  @Property({
    fieldName: 'quality_summary_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  qualitySummaryJson?: unknown;

  /**
   * Identificador asociado a lineage job run.
   */
  @Property({ fieldName: 'lineage_job_run_id', type: 'uuid', nullable: true })
  lineageJobRunId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
