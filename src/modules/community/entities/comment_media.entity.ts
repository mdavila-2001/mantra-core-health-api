import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `comment_media` (REQ-01-011:
 * imágenes, stickers y GIFs adjuntos a un comentario). Misma forma que
 * `PostMedia`, con `comment_id` en vez de `post_id`.
 */
@Entity({ schema: 'community', tableName: 'comment_media' })
export class CommentMedia {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a comment.
   */
  @Property({ fieldName: 'comment_id', type: 'uuid' }) // FK → community.comments
  commentId!: string;

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
