import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `social_posts`.
 */
@Entity({ schema: 'community', tableName: 'social_posts' })
export class SocialPosts {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a author public profile.
   */
  @Property({ fieldName: 'author_public_profile_id', type: 'uuid' }) // FK → community.public_profiles
  authorPublicProfileId!: string;

  /**
   * Identificador asociado a post type concept.
   */
  @Property({ fieldName: 'post_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  postTypeConceptId!: string;

  /**
   * Valor de body text mantenido por la instancia.
   */
  @Property({ fieldName: 'body_text', columnType: 'text' })
  bodyText!: string;

  /**
   * Identificador asociado a visibility concept.
   */
  @Property({
    fieldName: 'visibility_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  visibilityConceptId?: string;

  /**
   * Valor de comments enabled mantenido por la instancia.
   */
  @Property({ fieldName: 'comments_enabled', type: 'boolean', nullable: true })
  commentsEnabled?: boolean;

  /**
   * Identificador asociado a health data screening status concept.
   */
  @Property({
    fieldName: 'health_data_screening_status_concept_id',
    type: 'uuid',
  }) // FK → terminology.catalog_concepts
  healthDataScreeningStatusConceptId!: string;

  /**
   * Identificador asociado a moderation status concept.
   */
  @Property({ fieldName: 'moderation_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  moderationStatusConceptId!: string;

  /**
   * Identificador asociado a publication status concept.
   */
  @Property({ fieldName: 'publication_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  publicationStatusConceptId!: string;

  /**
   * Valor de published at mantenido por la instancia.
   */
  @Property({
    fieldName: 'published_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  publishedAt?: Date;

  /**
   * Valor de edited at mantenido por la instancia.
   */
  @Property({
    fieldName: 'edited_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  editedAt?: Date;

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
