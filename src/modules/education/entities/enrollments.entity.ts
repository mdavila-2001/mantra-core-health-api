import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `enrollments`.
 */
@Entity({ schema: 'education', tableName: 'enrollments' })
export class Enrollments {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a course.
   */
  @Property({ fieldName: 'course_id', type: 'uuid' }) // FK → education.courses
  courseId!: string;

  /**
   * Identificador asociado a cohort.
   */
  @Property({ fieldName: 'cohort_id', type: 'uuid', nullable: true }) // FK → education.course_cohorts
  cohortId?: string;

  /**
   * Identificador asociado a learner type concept.
   */
  @Property({ fieldName: 'learner_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  learnerTypeConceptId!: string;

  /**
   * Identificador asociado a learner ref.
   */
  @Property({ fieldName: 'learner_ref_id', type: 'uuid' })
  learnerRefId!: string;

  /**
   * Identificador asociado a enrollment source concept.
   */
  @Property({ fieldName: 'enrollment_source_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  enrollmentSourceConceptId!: string;

  /**
   * Identificador asociado a payment intent.
   */
  @Property({ fieldName: 'payment_intent_id', type: 'uuid', nullable: true }) // FK → payments.payment_intents
  paymentIntentId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de progress percent mantenido por la instancia.
   */
  @Property({
    fieldName: 'progress_percent',
    columnType: 'numeric',
    nullable: true,
  })
  progressPercent?: string;

  /**
   * Valor de enrolled at mantenido por la instancia.
   */
  @Property({
    fieldName: 'enrolled_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  enrolledAt?: Date;

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
   * Valor de expires at mantenido por la instancia.
   */
  @Property({
    fieldName: 'expires_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  expiresAt?: Date;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
