import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `lessons`.
 */
@Entity({ schema: 'education', tableName: 'lessons' })
export class Lessons {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a course module.
   */
  @Property({ fieldName: 'course_module_id', type: 'uuid' }) // FK → education.course_modules
  courseModuleId!: string;

  /**
   * Valor de title mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  title!: string;

  /**
   * Identificador asociado a content type concept.
   */
  @Property({ fieldName: 'content_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  contentTypeConceptId!: string;

  /**
   * Valor de body richtext json mantenido por la instancia.
   */
  @Property({
    fieldName: 'body_richtext_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  bodyRichtextJson?: unknown;

  /**
   * Identificador asociado a media file.
   */
  @Property({ fieldName: 'media_file_id', type: 'uuid', nullable: true }) // FK → common.files
  mediaFileId?: string;

  /**
   * Valor de external url mantenido por la instancia.
   */
  @Property({ fieldName: 'external_url', columnType: 'text', nullable: true })
  externalUrl?: string;

  /**
   * Valor de duration minutes mantenido por la instancia.
   */
  @Property({
    fieldName: 'duration_minutes',
    columnType: 'int',
    nullable: true,
  })
  durationMinutes?: number;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @Property({ columnType: 'int', nullable: true })
  ordinal?: number;

  /**
   * Valor de is preview mantenido por la instancia.
   */
  @Property({ fieldName: 'is_preview', type: 'boolean', nullable: true })
  isPreview?: boolean;

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
