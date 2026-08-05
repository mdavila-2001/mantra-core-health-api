import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `media_annotations`.
 */
@Entity({ schema: 'diagnostics', tableName: 'media_annotations' })
export class MediaAnnotations {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a clinical media.
   */
  @Property({ fieldName: 'clinical_media_id', type: 'uuid' }) // FK → diagnostics.clinical_media
  clinicalMediaId!: string;

  /**
   * Identificador asociado a imaging instance.
   */
  @Property({ fieldName: 'imaging_instance_id', type: 'uuid', nullable: true }) // FK → diagnostics.imaging_instances
  imagingInstanceId?: string;

  /**
   * Identificador asociado a annotation type concept.
   */
  @Property({ fieldName: 'annotation_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  annotationTypeConceptId!: string;

  /**
   * Valor de geometry json mantenido por la instancia.
   */
  @Property({
    fieldName: 'geometry_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  geometryJson?: unknown;

  /**
   * Identificador asociado a label concept.
   */
  @Property({ fieldName: 'label_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  labelConceptId?: string;

  /**
   * Valor de label text mantenido por la instancia.
   */
  @Property({ fieldName: 'label_text', columnType: 'varchar', nullable: true })
  labelText?: string;

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
   * Identificador asociado a author profile.
   */
  @Property({ fieldName: 'author_profile_id', type: 'uuid', nullable: true }) // FK → profiles.health_practitioner_profiles
  authorProfileId?: string;

  /**
   * Valor de algorithm model reference mantenido por la instancia.
   */
  @Property({
    fieldName: 'algorithm_model_reference',
    columnType: 'varchar',
    nullable: true,
  })
  algorithmModelReference?: string;

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
