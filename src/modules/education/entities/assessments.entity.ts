import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'education', tableName: 'assessments' })
export class Assessments {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'course_id', type: 'uuid' }) // FK → education.courses
  courseId!: string;

  @Property({ fieldName: 'course_module_id', type: 'uuid', nullable: true }) // FK → education.course_modules
  courseModuleId?: string;

  @Property({ columnType: 'varchar' })
  title!: string;

  @Property({ fieldName: 'assessment_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  assessmentTypeConceptId!: string;

  @Property({
    fieldName: 'passing_score',
    columnType: 'numeric',
    nullable: true,
  })
  passingScore?: string;

  @Property({ fieldName: 'max_attempts', columnType: 'int', nullable: true })
  maxAttempts?: number;

  @Property({
    fieldName: 'time_limit_minutes',
    columnType: 'int',
    nullable: true,
  })
  timeLimitMinutes?: number;

  @Property({ fieldName: 'is_graded', type: 'boolean', nullable: true })
  isGraded?: boolean;

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
