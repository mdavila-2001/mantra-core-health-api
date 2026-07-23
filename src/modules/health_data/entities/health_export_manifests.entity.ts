import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'health_data', tableName: 'health_export_manifests' })
export class HealthExportManifests {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'health_export_job_id', type: 'uuid' }) // FK → health_data.health_export_jobs
  healthExportJobId!: string;

  @Property({ fieldName: 'manifest_version', columnType: 'int' })
  manifestVersion!: number;

  @Property({ fieldName: 'file_id', type: 'uuid' }) // FK → common.files
  fileId!: string;

  @Property({ fieldName: 'content_hash', columnType: 'varchar' })
  contentHash!: string;

  @Property({ fieldName: 'record_count', type: 'bigint' })
  recordCount!: string;

  @Property({ fieldName: 'size_bytes', type: 'bigint' })
  sizeBytes!: string;

  @Property({
    fieldName: 'encryption_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK → polyglot_storage.encryption_profiles
  encryptionProfileId?: string;

  @Property({ fieldName: 'retention_policy_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  retentionPolicyId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
