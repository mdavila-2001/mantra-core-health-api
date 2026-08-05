import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `field_value_provenance`.
 */
@Entity({ schema: 'forms', tableName: 'field_value_provenance' })
export class FieldValueProvenance {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a field value.
   */
  @Property({ fieldName: 'field_value_id', type: 'uuid' }) // FK → forms.field_values
  fieldValueId!: string;

  /**
   * Valor de source system uri mantenido por la instancia.
   */
  @Property({
    fieldName: 'source_system_uri',
    columnType: 'text',
    nullable: true,
  })
  sourceSystemUri?: string;

  /**
   * Valor de source resource type mantenido por la instancia.
   */
  @Property({
    fieldName: 'source_resource_type',
    columnType: 'varchar',
    nullable: true,
  })
  sourceResourceType?: string;

  /**
   * Identificador asociado a source resource.
   */
  @Property({
    fieldName: 'source_resource_id',
    columnType: 'varchar',
    nullable: true,
  })
  sourceResourceId?: string;

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
   * Identificador asociado a import batch.
   */
  @Property({ fieldName: 'import_batch_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  importBatchId?: string;

  /**
   * Identificador asociado a author profile.
   */
  @Property({ fieldName: 'author_profile_id', type: 'uuid', nullable: true }) // FK → profiles.health_practitioner_profiles
  authorProfileId?: string;

  /**
   * Identificador asociado a entered by user.
   */
  @Property({ fieldName: 'entered_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  enteredByUserId?: string;

  /**
   * Identificador asociado a verification status concept.
   */
  @Property({
    fieldName: 'verification_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  verificationStatusConceptId?: string;

  /**
   * Valor de confidence score mantenido por la instancia.
   */
  @Property({
    fieldName: 'confidence_score',
    columnType: 'numeric',
    nullable: true,
  })
  confidenceScore?: string;

  /**
   * Valor de content hash mantenido por la instancia.
   */
  @Property({
    fieldName: 'content_hash',
    columnType: 'varchar',
    nullable: true,
  })
  contentHash?: string;

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
