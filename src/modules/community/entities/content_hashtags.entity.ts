import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `content_hashtags`.
 */
@Entity({ schema: 'community', tableName: 'content_hashtags' })
export class ContentHashtags {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a hashtag.
   */
  @Property({ fieldName: 'hashtag_id', type: 'uuid' }) // FK → community.hashtags
  hashtagId!: string;

  /**
   * Identificador asociado a content type concept.
   */
  @Property({ fieldName: 'content_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  contentTypeConceptId!: string;

  /**
   * Identificador asociado a content ref.
   */
  @Property({ fieldName: 'content_ref_id', type: 'uuid' })
  contentRefId!: string;

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
