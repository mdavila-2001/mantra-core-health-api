import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'education', tableName: 'lesson_progress' })
export class LessonProgress {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'enrollment_id', type: 'uuid' }) // FK → education.enrollments
  enrollmentId!: string;

  @Property({ fieldName: 'lesson_id', type: 'uuid' }) // FK → education.lessons
  lessonId!: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'seconds_watched', columnType: 'int', nullable: true })
  secondsWatched?: number;

  @Property({
    fieldName: 'completion_percent',
    columnType: 'numeric',
    nullable: true,
  })
  completionPercent?: string;

  @Property({
    fieldName: 'completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  completedAt?: Date;

  @Property({
    fieldName: 'occurred_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  occurredAt?: Date;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
