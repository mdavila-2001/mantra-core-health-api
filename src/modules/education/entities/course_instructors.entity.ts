import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'education', tableName: 'course_instructors' })
export class CourseInstructors {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'course_id', type: 'uuid' }) // FK → education.courses
  courseId!: string;

  @Property({ fieldName: 'instructor_id', type: 'uuid' }) // FK → education.instructors
  instructorId!: string;

  @Property({ fieldName: 'role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  roleConceptId!: string;

  @Property({ columnType: 'int', nullable: true })
  ordinal?: number;

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
