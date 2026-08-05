import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `comments`.
 */
@Entity({ schema: 'community', tableName: 'comments' })
export class Comments {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  /**
   * Identificador asociado a author profile.
   */
  @Property({ fieldName: 'author_profile_id', type: 'uuid' }) // FK → community.public_profiles
  authorProfileId!: string;

  /**
   * Identificador asociado a commentable type concept.
   */
  @Property({ fieldName: 'commentable_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  commentableTypeConceptId!: string;

  /**
   * Identificador asociado a commentable ref.
   */
  @Property({ fieldName: 'commentable_ref_id', type: 'uuid' })
  commentableRefId!: string;

  /**
   * Identificador asociado a parent comment.
   */
  @Property({ fieldName: 'parent_comment_id', type: 'uuid', nullable: true }) // FK → community.comments
  parentCommentId?: string;

  /**
   * Identificador asociado a root comment.
   */
  @Property({ fieldName: 'root_comment_id', type: 'uuid', nullable: true }) // FK → community.comments
  rootCommentId?: string;

  /**
   * Valor de thread depth mantenido por la instancia.
   */
  @Property({ fieldName: 'thread_depth', columnType: 'int', nullable: true })
  threadDepth?: number;

  /**
   * Valor de body text mantenido por la instancia.
   */
  @Property({ fieldName: 'body_text', columnType: 'text' })
  bodyText!: string;

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
   * Valor de reply count mantenido por la instancia.
   */
  @Property({ fieldName: 'reply_count', columnType: 'int', nullable: true })
  replyCount?: number;

  /**
   * Valor de reaction count mantenido por la instancia.
   */
  @Property({ fieldName: 'reaction_count', columnType: 'int', nullable: true })
  reactionCount?: number;

  /**
   * Valor de is edited mantenido por la instancia.
   */
  @Property({ fieldName: 'is_edited', type: 'boolean', nullable: true })
  isEdited?: boolean;

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
