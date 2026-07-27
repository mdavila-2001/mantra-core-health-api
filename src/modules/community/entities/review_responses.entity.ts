import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'community', tableName: 'review_responses' })
export class ReviewResponses {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'review_id', type: 'uuid' }) // FK → community.service_reviews
  reviewId!: string;

  @Property({ fieldName: 'responder_public_profile_id', type: 'uuid' }) // FK → community.public_profiles
  responderPublicProfileId!: string;

  @Property({ fieldName: 'response_text', columnType: 'text' })
  responseText!: string;

  @Property({ fieldName: 'moderation_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  moderationStatusConceptId!: string;

  @Property({
    fieldName: 'published_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  publishedAt?: Date;

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
