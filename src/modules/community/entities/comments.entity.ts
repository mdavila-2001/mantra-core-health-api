import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'community', tableName: 'comments' })
export class Comments {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  @Property({ fieldName: 'author_profile_id', type: 'uuid' }) // FK (destino no resuelto)
  authorProfileId!: string;

  @Property({ fieldName: 'commentable_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  commentableTypeConceptId!: string;

  @Property({ fieldName: 'commentable_ref_id', type: 'uuid' })
  commentableRefId!: string;

  @Property({ fieldName: 'parent_comment_id', type: 'uuid', nullable: true }) // FK → community.comments
  parentCommentId?: string;

  @Property({ fieldName: 'root_comment_id', type: 'uuid', nullable: true }) // FK → community.comments
  rootCommentId?: string;

  @Property({ fieldName: 'thread_depth', columnType: 'int', nullable: true })
  threadDepth?: number;

  @Property({ fieldName: 'body_text', columnType: 'text' })
  bodyText!: string;

  @Property({
    fieldName: 'body_richtext_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  bodyRichtextJson?: unknown;

  @Property({ fieldName: 'reply_count', columnType: 'int', nullable: true })
  replyCount?: number;

  @Property({ fieldName: 'reaction_count', columnType: 'int', nullable: true })
  reactionCount?: number;

  @Property({ fieldName: 'is_edited', type: 'boolean', nullable: true })
  isEdited?: boolean;

  @Property({
    fieldName: 'edited_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  editedAt?: Date;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
