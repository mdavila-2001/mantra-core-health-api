import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `health_ingestion_records`.
 */
@Entity({ schema: 'health_data', tableName: 'health_ingestion_records' })
export class HealthIngestionRecords {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a health ingestion batch.
   */
  @Property({ fieldName: 'health_ingestion_batch_id', type: 'uuid' }) // FK → health_data.health_ingestion_batches
  healthIngestionBatchId!: string;

  /**
   * Valor de source record identifier mantenido por la instancia.
   */
  @Property({ fieldName: 'source_record_identifier', columnType: 'varchar' })
  sourceRecordIdentifier!: string;

  /**
   * Identificador asociado a resource type concept.
   */
  @Property({ fieldName: 'resource_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  resourceTypeConceptId!: string;

  /**
   * Valor de source version mantenido por la instancia.
   */
  @Property({
    fieldName: 'source_version',
    columnType: 'varchar',
    nullable: true,
  })
  sourceVersion?: string;

  /**
   * Valor de source last updated at mantenido por la instancia.
   */
  @Property({
    fieldName: 'source_last_updated_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  sourceLastUpdatedAt?: Date;

  /**
   * Valor de payload hash mantenido por la instancia.
   */
  @Property({ fieldName: 'payload_hash', columnType: 'varchar' })
  payloadHash!: string;

  /**
   * Identificador asociado a payload file.
   */
  @Property({ fieldName: 'payload_file_id', type: 'uuid', nullable: true }) // FK → common.files
  payloadFileId?: string;

  /**
   * Identificador asociado a validation status concept.
   */
  @Property({ fieldName: 'validation_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  validationStatusConceptId!: string;

  /**
   * Identificador asociado a processing status concept.
   */
  @Property({ fieldName: 'processing_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  processingStatusConceptId!: string;

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
   * Valor de error summary json mantenido por la instancia.
   */
  @Property({
    fieldName: 'error_summary_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  errorSummaryJson?: unknown;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
