import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'education', tableName: 'enrollments' })
export class Enrollments {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'course_id', type: 'uuid' }) // FK → education.courses
  courseId!: string;

  @Property({ fieldName: 'cohort_id', type: 'uuid', nullable: true }) // FK → education.course_cohorts
  cohortId?: string;

  @Property({ fieldName: 'learner_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  learnerTypeConceptId!: string;

  @Property({ fieldName: 'learner_ref_id', type: 'uuid' })
  learnerRefId!: string;

  @Property({ fieldName: 'enrollment_source_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  enrollmentSourceConceptId!: string;

  @Property({ fieldName: 'payment_intent_id', type: 'uuid', nullable: true }) // FK → payments.payment_intents
  paymentIntentId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'progress_percent',
    columnType: 'numeric',
    nullable: true,
  })
  progressPercent?: string;

  @Property({
    fieldName: 'enrolled_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  enrolledAt?: Date;

  @Property({
    fieldName: 'completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  completedAt?: Date;

  @Property({
    fieldName: 'expires_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  expiresAt?: Date;

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
