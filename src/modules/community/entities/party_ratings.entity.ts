import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'community', tableName: 'party_ratings' })
export class PartyRatings {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({
    fieldName: 'reviewer_patient_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK → profiles.patient_profiles
  reviewerPatientProfileId?: string;

  @Property({
    fieldName: 'reviewer_practitioner_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK → profiles.health_practitioner_profiles
  reviewerPractitionerProfileId?: string;

  @Property({ fieldName: 'reviewer_practice_id', type: 'uuid', nullable: true }) // FK → practice.practices
  reviewerPracticeId?: string;

  @Property({
    fieldName: 'target_patient_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK → profiles.patient_profiles
  targetPatientProfileId?: string;

  @Property({
    fieldName: 'target_practitioner_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK → profiles.health_practitioner_profiles
  targetPractitionerProfileId?: string;

  @Property({ fieldName: 'target_practice_id', type: 'uuid', nullable: true }) // FK → practice.practices
  targetPracticeId?: string;

  @Property({
    fieldName: 'verified_encounter_id',
    type: 'uuid',
    nullable: true,
  }) // FK → clinical.encounters
  verifiedEncounterId?: string;

  @Property({
    fieldName: 'verified_role_assignment_id',
    type: 'uuid',
    nullable: true,
  }) // FK → practice.practitioner_role_assignments
  verifiedRoleAssignmentId?: string;

  @Property({ fieldName: 'overall_rating', columnType: 'smallint' })
  overallRating!: number;

  @Property({ fieldName: 'comment_text', columnType: 'text', nullable: true })
  commentText?: string;

  @Property({ fieldName: 'moderation_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  moderationStatusConceptId!: string;

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
