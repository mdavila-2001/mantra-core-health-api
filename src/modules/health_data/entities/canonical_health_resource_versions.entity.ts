import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `canonical_health_resource_versions`.
 */
@Entity({
  schema: 'health_data',
  tableName: 'canonical_health_resource_versions',
})
export class CanonicalHealthResourceVersions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a canonical health resource.
   */
  @Property({ fieldName: 'canonical_health_resource_id', type: 'uuid' }) // FK → health_data.canonical_health_resources
  canonicalHealthResourceId!: string;

  /**
   * Valor de version number mantenido por la instancia.
   */
  @Property({ fieldName: 'version_number', columnType: 'int' })
  versionNumber!: number;

  /**
   * Identificador asociado a health ingestion record.
   */
  @Property({
    fieldName: 'health_ingestion_record_id',
    type: 'uuid',
    nullable: true,
  }) // FK → health_data.health_ingestion_records
  healthIngestionRecordId?: string;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  /**
   * Valor de effective start at mantenido por la instancia.
   */
  @Property({
    fieldName: 'effective_start_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveStartAt?: Date;

  /**
   * Valor de effective end at mantenido por la instancia.
   */
  @Property({
    fieldName: 'effective_end_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveEndAt?: Date;

  /**
   * Identificador asociado a change type concept.
   */
  @Property({ fieldName: 'change_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  changeTypeConceptId!: string;

  /**
   * Identificador asociado a payload format concept.
   */
  @Property({ fieldName: 'payload_format_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  payloadFormatConceptId!: string;

  /**
   * Valor de normalized payload json mantenido por la instancia.
   */
  @Property({
    fieldName: 'normalized_payload_json',
    type: 'json',
    columnType: 'jsonb',
  })
  normalizedPayloadJson!: unknown;

  /**
   * Identificador asociado a original payload file.
   */
  @Property({
    fieldName: 'original_payload_file_id',
    type: 'uuid',
    nullable: true,
  }) // FK → common.files
  originalPayloadFileId?: string;

  /**
   * Valor de content hash mantenido por la instancia.
   */
  @Property({ fieldName: 'content_hash', columnType: 'varchar' })
  contentHash!: string;

  /**
   * Identificador asociado a provenance record.
   */
  @Property({ fieldName: 'provenance_record_id', type: 'uuid', nullable: true }) // FK → health_data.health_provenance_records
  provenanceRecordId?: string;

  /**
   * Identificador asociado a supersedes version.
   */
  @Property({
    fieldName: 'supersedes_version_id',
    type: 'uuid',
    nullable: true,
  }) // FK → health_data.canonical_health_resource_versions
  supersedesVersionId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
