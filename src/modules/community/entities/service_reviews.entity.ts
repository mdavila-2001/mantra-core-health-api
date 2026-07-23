import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'community', tableName: 'service_reviews' })
export class ServiceReviews {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'target_public_profile_id', type: 'uuid' }) // FK → community.public_profiles
  targetPublicProfileId!: string;

  @Property({ fieldName: 'reviewer_patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  reviewerPatientProfileId!: string;

  @Property({
    fieldName: 'verified_encounter_id',
    type: 'uuid',
    nullable: true,
  }) // FK → clinical.encounters
  verifiedEncounterId?: string;

  @Property({ fieldName: 'overall_rating', columnType: 'smallint' })
  overallRating!: number;

  @Property({ fieldName: 'review_text', columnType: 'text', nullable: true })
  reviewText?: string;

  @Property({
    fieldName: 'reviewer_display_mode_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  reviewerDisplayModeConceptId?: string;

  @Property({ fieldName: 'verification_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  verificationStatusConceptId!: string;

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
