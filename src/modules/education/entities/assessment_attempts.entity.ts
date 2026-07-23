import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'education', tableName: 'assessment_attempts' })
export class AssessmentAttempts {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'assessment_id', type: 'uuid' }) // FK → education.assessments
  assessmentId!: string;

  @Property({ fieldName: 'enrollment_id', type: 'uuid' }) // FK → education.enrollments
  enrollmentId!: string;

  @Property({ fieldName: 'attempt_number', columnType: 'int' })
  attemptNumber!: number;

  @Property({ columnType: 'numeric', nullable: true })
  score?: string;

  @Property({ type: 'boolean', nullable: true })
  passed?: boolean;

  @Property({
    fieldName: 'responses_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  responsesJson?: unknown;

  @Property({
    fieldName: 'started_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startedAt?: Date;

  @Property({
    fieldName: 'submitted_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  submittedAt?: Date;

  @Property({ fieldName: 'graded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  gradedByUserId?: string;

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
