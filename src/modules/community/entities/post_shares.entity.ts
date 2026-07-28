import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `post_shares`.
 */
@Entity({ schema: 'community', tableName: 'post_shares' })
export class PostShares {
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
   * Identificador asociado a sharer profile.
   */
  @Property({ fieldName: 'sharer_profile_id', type: 'uuid' }) // FK → community.public_profiles
  sharerProfileId!: string;

  /**
   * Identificador asociado a share type concept.
   */
  @Property({ fieldName: 'share_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  shareTypeConceptId!: string;

  /**
   * Valor de quote text mantenido por la instancia.
   */
  @Property({ fieldName: 'quote_text', columnType: 'text', nullable: true })
  quoteText?: string;

  /**
   * Identificador asociado a target group.
   */
  @Property({ fieldName: 'target_group_id', type: 'uuid', nullable: true }) // FK → community.groups
  targetGroupId?: string;

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
