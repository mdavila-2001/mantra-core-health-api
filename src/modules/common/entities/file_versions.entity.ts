import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `file_versions`.
 */
@Entity({ schema: 'common', tableName: 'file_versions' })
export class FileVersions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a file.
   */
  @Property({ fieldName: 'file_id', type: 'uuid' }) // FK → common.files
  fileId!: string;

  /**
   * Valor de version number mantenido por la instancia.
   */
  @Property({ fieldName: 'version_number', columnType: 'int' })
  versionNumber!: number;

  /**
   * Identificador asociado a storage provider concept.
   */
  @Property({ fieldName: 'storage_provider_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  storageProviderConceptId!: string;

  /**
   * Identificador asociado a storage region concept.
   */
  @Property({ fieldName: 'storage_region_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  storageRegionConceptId!: string;

  /**
   * Valor de bucket or container mantenido por la instancia.
   */
  @Property({
    fieldName: 'bucket_or_container',
    columnType: 'varchar',
    nullable: true,
  })
  bucketOrContainer?: string;

  /**
   * Valor de object key mantenido por la instancia.
   */
  @Property({ fieldName: 'object_key', columnType: 'text', nullable: true })
  objectKey?: string;

  /**
   * Valor de object version mantenido por la instancia.
   */
  @Property({
    fieldName: 'object_version',
    columnType: 'varchar',
    nullable: true,
  })
  objectVersion?: string;

  /**
   * Valor de storage uri mantenido por la instancia.
   */
  @Property({ fieldName: 'storage_uri', columnType: 'text' })
  storageUri!: string;

  /**
   * Valor de external source uri mantenido por la instancia.
   */
  @Property({
    fieldName: 'external_source_uri',
    columnType: 'text',
    nullable: true,
  })
  externalSourceUri?: string;

  /**
   * Valor de mime type mantenido por la instancia.
   */
  @Property({ fieldName: 'mime_type', columnType: 'varchar' })
  mimeType!: string;

  /**
   * Valor de size bytes mantenido por la instancia.
   */
  @Property({ fieldName: 'size_bytes', type: 'bigint' })
  sizeBytes!: string;

  /**
   * Identificador asociado a checksum algorithm concept.
   */
  @Property({ fieldName: 'checksum_algorithm_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  checksumAlgorithmConceptId!: string;

  /**
   * Valor de content hash mantenido por la instancia.
   */
  @Property({ fieldName: 'content_hash', columnType: 'varchar' })
  contentHash!: string;

  /**
   * Identificador asociado a encryption status concept.
   */
  @Property({ fieldName: 'encryption_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  encryptionStatusConceptId!: string;

  /**
   * Valor de encryption key reference mantenido por la instancia.
   */
  @Property({
    fieldName: 'encryption_key_reference',
    columnType: 'varchar',
    nullable: true,
  })
  encryptionKeyReference?: string;

  /**
   * Identificador asociado a malware scan status concept.
   */
  @Property({ fieldName: 'malware_scan_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  malwareScanStatusConceptId!: string;

  /**
   * Identificador asociado a integrity status concept.
   */
  @Property({
    fieldName: 'integrity_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  integrityStatusConceptId?: string;

  /**
   * Valor de uploaded at mantenido por la instancia.
   */
  @Property({
    fieldName: 'uploaded_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  uploadedAt?: Date;

  /**
   * Valor de verified at mantenido por la instancia.
   */
  @Property({
    fieldName: 'verified_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  verifiedAt?: Date;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  /**
   * Identificador asociado a recorded by user.
   */
  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
