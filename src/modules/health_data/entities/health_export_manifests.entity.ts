import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `health_export_manifests`.
 */
@Entity({ schema: 'health_data', tableName: 'health_export_manifests' })
export class HealthExportManifests {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a health export job.
   */
  @Property({ fieldName: 'health_export_job_id', type: 'uuid' }) // FK → health_data.health_export_jobs
  healthExportJobId!: string;

  /**
   * Valor de manifest version mantenido por la instancia.
   */
  @Property({ fieldName: 'manifest_version', columnType: 'int' })
  manifestVersion!: number;

  /**
   * Identificador asociado a file.
   */
  @Property({ fieldName: 'file_id', type: 'uuid' }) // FK → common.files
  fileId!: string;

  /**
   * Valor de content hash mantenido por la instancia.
   */
  @Property({ fieldName: 'content_hash', columnType: 'varchar' })
  contentHash!: string;

  /**
   * Valor de record count mantenido por la instancia.
   */
  @Property({ fieldName: 'record_count', type: 'bigint' })
  recordCount!: string;

  /**
   * Valor de size bytes mantenido por la instancia.
   */
  @Property({ fieldName: 'size_bytes', type: 'bigint' })
  sizeBytes!: string;

  /**
   * Identificador asociado a encryption profile.
   */
  @Property({
    fieldName: 'encryption_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK → polyglot_storage.encryption_profiles
  encryptionProfileId?: string;

  /**
   * Identificador asociado a retention policy.
   */
  @Property({ fieldName: 'retention_policy_id', type: 'uuid', nullable: true }) // FK → system_ops.retention_policies
  retentionPolicyId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
