import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `lesson_progress`.
 */
@Entity({ schema: 'education', tableName: 'lesson_progress' })
export class LessonProgress {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a enrollment.
   */
  @Property({ fieldName: 'enrollment_id', type: 'uuid' }) // FK → education.enrollments
  enrollmentId!: string;

  /**
   * Identificador asociado a lesson.
   */
  @Property({ fieldName: 'lesson_id', type: 'uuid' }) // FK → education.lessons
  lessonId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de seconds watched mantenido por la instancia.
   */
  @Property({ fieldName: 'seconds_watched', columnType: 'int', nullable: true })
  secondsWatched?: number;

  /**
   * Valor de completion percent mantenido por la instancia.
   */
  @Property({
    fieldName: 'completion_percent',
    columnType: 'numeric',
    nullable: true,
  })
  completionPercent?: string;

  /**
   * Valor de completed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  completedAt?: Date;

  /**
   * Valor de occurred at mantenido por la instancia.
   */
  @Property({
    fieldName: 'occurred_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  occurredAt?: Date;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  /**
   * Identificador asociado a recorded by user.
   */
  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
