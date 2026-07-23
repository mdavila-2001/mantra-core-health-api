import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'common', tableName: 'file_versions' })
export class FileVersions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'file_id', type: 'uuid' }) // FK → common.files
  fileId!: string;

  @Property({ fieldName: 'version_number', columnType: 'int' })
  versionNumber!: number;

  @Property({ fieldName: 'storage_provider_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  storageProviderConceptId!: string;

  @Property({ fieldName: 'storage_region_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  storageRegionConceptId!: string;

  @Property({
    fieldName: 'bucket_or_container',
    columnType: 'varchar',
    nullable: true,
  })
  bucketOrContainer?: string;

  @Property({ fieldName: 'object_key', columnType: 'text', nullable: true })
  objectKey?: string;

  @Property({
    fieldName: 'object_version',
    columnType: 'varchar',
    nullable: true,
  })
  objectVersion?: string;

  @Property({ fieldName: 'storage_uri', columnType: 'text' })
  storageUri!: string;

  @Property({
    fieldName: 'external_source_uri',
    columnType: 'text',
    nullable: true,
  })
  externalSourceUri?: string;

  @Property({ fieldName: 'mime_type', columnType: 'varchar' })
  mimeType!: string;

  @Property({ fieldName: 'size_bytes', type: 'bigint' })
  sizeBytes!: string;

  @Property({ fieldName: 'checksum_algorithm_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  checksumAlgorithmConceptId!: string;

  @Property({ fieldName: 'content_hash', columnType: 'varchar' })
  contentHash!: string;

  @Property({ fieldName: 'encryption_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  encryptionStatusConceptId!: string;

  @Property({
    fieldName: 'encryption_key_reference',
    columnType: 'varchar',
    nullable: true,
  })
  encryptionKeyReference?: string;

  @Property({ fieldName: 'malware_scan_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  malwareScanStatusConceptId!: string;

  @Property({
    fieldName: 'integrity_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  integrityStatusConceptId?: string;

  @Property({
    fieldName: 'uploaded_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  uploadedAt?: Date;

  @Property({
    fieldName: 'verified_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  verifiedAt?: Date;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
