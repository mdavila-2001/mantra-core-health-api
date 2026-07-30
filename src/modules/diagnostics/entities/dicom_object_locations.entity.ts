import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `dicom_object_locations`.
 */
@Entity({ schema: 'diagnostics', tableName: 'dicom_object_locations' })
export class DicomObjectLocations {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a imaging instance.
   */
  @Property({ fieldName: 'imaging_instance_id', type: 'uuid' }) // FK → diagnostics.imaging_instances
  imagingInstanceId!: string;

  /**
   * Identificador asociado a storage backend.
   */
  @Property({ fieldName: 'storage_backend_id', type: 'uuid' }) // FK → polyglot_storage.storage_backends
  storageBackendId!: string;

  /**
   * Valor de object key mantenido por la instancia.
   */
  @Property({ fieldName: 'object_key', columnType: 'varchar' })
  objectKey!: string;

  /**
   * Identificador asociado a object version.
   */
  @Property({
    fieldName: 'object_version_id',
    columnType: 'varchar',
    nullable: true,
  })
  objectVersionId?: string;

  /**
   * Valor de transfer syntax uid mantenido por la instancia.
   */
  @Property({
    fieldName: 'transfer_syntax_uid',
    columnType: 'varchar',
    nullable: true,
  })
  transferSyntaxUid?: string;

  /**
   * Valor de content hash mantenido por la instancia.
   */
  @Property({ fieldName: 'content_hash', columnType: 'varchar' })
  contentHash!: string;

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
   * Identificador asociado a legal hold.
   */
  @Property({ fieldName: 'legal_hold_id', type: 'uuid', nullable: true }) // FK → system_ops.legal_holds
  legalHoldId?: string;

  /**
   * Valor de is primary mantenido por la instancia.
   */
  @Property({ fieldName: 'is_primary', type: 'boolean', nullable: true })
  isPrimary?: boolean;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
