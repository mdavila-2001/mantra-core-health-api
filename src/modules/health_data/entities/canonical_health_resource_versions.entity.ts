import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'health_data',
  tableName: 'canonical_health_resource_versions',
})
export class CanonicalHealthResourceVersions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'canonical_health_resource_id', type: 'uuid' }) // FK → health_data.canonical_health_resources
  canonicalHealthResourceId!: string;

  @Property({ fieldName: 'version_number', columnType: 'int' })
  versionNumber!: number;

  @Property({
    fieldName: 'health_ingestion_record_id',
    type: 'uuid',
    nullable: true,
  }) // FK → health_data.health_ingestion_records
  healthIngestionRecordId?: string;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({
    fieldName: 'effective_start_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveStartAt?: Date;

  @Property({
    fieldName: 'effective_end_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveEndAt?: Date;

  @Property({ fieldName: 'change_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  changeTypeConceptId!: string;

  @Property({ fieldName: 'payload_format_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  payloadFormatConceptId!: string;

  @Property({
    fieldName: 'normalized_payload_json',
    type: 'json',
    columnType: 'jsonb',
  })
  normalizedPayloadJson!: unknown;

  @Property({
    fieldName: 'original_payload_file_id',
    type: 'uuid',
    nullable: true,
  }) // FK → common.files
  originalPayloadFileId?: string;

  @Property({ fieldName: 'content_hash', columnType: 'varchar' })
  contentHash!: string;

  @Property({ fieldName: 'provenance_record_id', type: 'uuid', nullable: true }) // FK → health_data.health_provenance_records
  provenanceRecordId?: string;

  @Property({
    fieldName: 'supersedes_version_id',
    type: 'uuid',
    nullable: true,
  }) // FK → health_data.canonical_health_resource_versions
  supersedesVersionId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
