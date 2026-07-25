import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'diagnostics', tableName: 'dicom_object_locations' })
export class DicomObjectLocations {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'imaging_instance_id', type: 'uuid' }) // FK → diagnostics.imaging_instances
  imagingInstanceId!: string;

  @Property({ fieldName: 'storage_backend_id', type: 'uuid' }) // FK → polyglot_storage.storage_backends
  storageBackendId!: string;

  @Property({ fieldName: 'object_key', columnType: 'varchar' })
  objectKey!: string;

  @Property({
    fieldName: 'object_version_id',
    columnType: 'varchar',
    nullable: true,
  })
  objectVersionId?: string;

  @Property({
    fieldName: 'transfer_syntax_uid',
    columnType: 'varchar',
    nullable: true,
  })
  transferSyntaxUid?: string;

  @Property({ fieldName: 'content_hash', columnType: 'varchar' })
  contentHash!: string;

  @Property({ fieldName: 'size_bytes', type: 'bigint' })
  sizeBytes!: string;

  @Property({
    fieldName: 'encryption_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK → polyglot_storage.encryption_profiles
  encryptionProfileId?: string;

  @Property({ fieldName: 'retention_policy_id', type: 'uuid', nullable: true }) // FK → system_ops.retention_policies
  retentionPolicyId?: string;

  @Property({ fieldName: 'legal_hold_id', type: 'uuid', nullable: true }) // FK → system_ops.legal_holds
  legalHoldId?: string;

  @Property({ fieldName: 'is_primary', type: 'boolean', nullable: true })
  isPrimary?: boolean;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
