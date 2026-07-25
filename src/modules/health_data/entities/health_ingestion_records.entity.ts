import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'health_data', tableName: 'health_ingestion_records' })
export class HealthIngestionRecords {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'health_ingestion_batch_id', type: 'uuid' }) // FK → health_data.health_ingestion_batches
  healthIngestionBatchId!: string;

  @Property({ fieldName: 'source_record_identifier', columnType: 'varchar' })
  sourceRecordIdentifier!: string;

  @Property({ fieldName: 'resource_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  resourceTypeConceptId!: string;

  @Property({
    fieldName: 'source_version',
    columnType: 'varchar',
    nullable: true,
  })
  sourceVersion?: string;

  @Property({
    fieldName: 'source_last_updated_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  sourceLastUpdatedAt?: Date;

  @Property({ fieldName: 'payload_hash', columnType: 'varchar' })
  payloadHash!: string;

  @Property({ fieldName: 'payload_file_id', type: 'uuid', nullable: true }) // FK → common.files
  payloadFileId?: string;

  @Property({ fieldName: 'validation_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  validationStatusConceptId!: string;

  @Property({ fieldName: 'processing_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  processingStatusConceptId!: string;

  @Property({
    fieldName: 'canonical_resource_id',
    type: 'uuid',
    nullable: true,
  }) // FK → health_data.canonical_health_resources
  canonicalResourceId?: string;

  @Property({
    fieldName: 'error_summary_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  errorSummaryJson?: unknown;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
