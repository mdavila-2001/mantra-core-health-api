import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'chart', tableName: 'clinical_note_versions' })
export class ClinicalNoteVersions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'clinical_note_id', type: 'uuid' }) // FK → chart.clinical_note_headers
  clinicalNoteId!: string;

  @Property({ fieldName: 'version_number', columnType: 'int' })
  versionNumber!: number;

  @Property({ fieldName: 'author_profile_id', type: 'uuid' }) // FK → profiles.health_practitioner_profiles
  authorProfileId!: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'chief_complaint_text',
    columnType: 'text',
    nullable: true,
  })
  chiefComplaintText?: string;

  @Property({
    fieldName: 'subjective_text',
    columnType: 'text',
    nullable: true,
  })
  subjectiveText?: string;

  @Property({ fieldName: 'objective_text', columnType: 'text', nullable: true })
  objectiveText?: string;

  @Property({
    fieldName: 'assessment_text',
    columnType: 'text',
    nullable: true,
  })
  assessmentText?: string;

  @Property({ fieldName: 'plan_text', columnType: 'text', nullable: true })
  planText?: string;

  @Property({
    fieldName: 'supersedes_version_id',
    type: 'uuid',
    nullable: true,
  }) // FK → chart.clinical_note_versions
  supersedesVersionId?: string;

  @Property({
    fieldName: 'amendment_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  amendmentReasonConceptId?: string;

  @Property({
    fieldName: 'amendment_reason_text',
    columnType: 'text',
    nullable: true,
  })
  amendmentReasonText?: string;

  @Property({ fieldName: 'signed_by_profile_id', type: 'uuid', nullable: true }) // FK → profiles.health_practitioner_profiles
  signedByProfileId?: string;

  @Property({
    fieldName: 'signed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  signedAt?: Date;

  @Property({
    fieldName: 'content_hash',
    columnType: 'varchar',
    nullable: true,
  })
  contentHash?: string;

  @Property({
    fieldName: 'release_eligibility_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  releaseEligibilityConceptId?: string;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
