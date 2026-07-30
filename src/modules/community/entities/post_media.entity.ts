import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `post_media`.
 */
@Entity({ schema: 'community', tableName: 'post_media' })
export class PostMedia {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a post.
   */
  @Property({ fieldName: 'post_id', type: 'uuid' }) // FK → community.social_posts
  postId!: string;

  /**
   * Identificador asociado a file.
   */
  @Property({ fieldName: 'file_id', type: 'uuid' }) // FK → common.files
  fileId!: string;

  /**
   * Identificador asociado a media role concept.
   */
  @Property({ fieldName: 'media_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  mediaRoleConceptId!: string;

  /**
   * Valor de alt text mantenido por la instancia.
   */
  @Property({ fieldName: 'alt_text', columnType: 'varchar', nullable: true })
  altText?: string;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @Property({ columnType: 'int', nullable: true })
  ordinal?: number;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
