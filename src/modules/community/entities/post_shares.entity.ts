import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'community', tableName: 'post_shares' })
export class PostShares {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'post_id', type: 'uuid' })  // FK → community.social_posts
  postId!: string;

  @Property({ fieldName: 'sharer_profile_id', type: 'uuid' })  // FK → community.public_profiles
  sharerProfileId!: string;

  @Property({ fieldName: 'share_type_concept_id', type: 'uuid' })  // FK → terminology.catalog_concepts
  shareTypeConceptId!: string;

  @Property({ fieldName: 'quote_text', columnType: 'text', nullable: true })
  quoteText?: string;

  @Property({ fieldName: 'target_group_id', type: 'uuid', nullable: true })  // FK → community.groups
  targetGroupId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })  // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true })  // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;

}
