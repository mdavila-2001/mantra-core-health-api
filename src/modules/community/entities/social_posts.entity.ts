import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'community', tableName: 'social_posts' })
export class SocialPosts {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'author_public_profile_id', type: 'uuid' }) // FK → community.public_profiles
  authorPublicProfileId!: string;

  @Property({ fieldName: 'post_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  postTypeConceptId!: string;

  @Property({ fieldName: 'body_text', columnType: 'text' })
  bodyText!: string;

  @Property({
    fieldName: 'visibility_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  visibilityConceptId?: string;

  @Property({ fieldName: 'comments_enabled', type: 'boolean', nullable: true })
  commentsEnabled?: boolean;

  @Property({
    fieldName: 'health_data_screening_status_concept_id',
    type: 'uuid',
  }) // FK → terminology.catalog_concepts
  healthDataScreeningStatusConceptId!: string;

  @Property({ fieldName: 'moderation_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  moderationStatusConceptId!: string;

  @Property({ fieldName: 'publication_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  publicationStatusConceptId!: string;

  @Property({
    fieldName: 'published_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  publishedAt?: Date;

  @Property({
    fieldName: 'edited_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  editedAt?: Date;

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
