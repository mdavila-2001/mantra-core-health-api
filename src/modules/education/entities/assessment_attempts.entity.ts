import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `assessment_attempts`.
 */
@Entity({ schema: 'education', tableName: 'assessment_attempts' })
export class AssessmentAttempts {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a assessment.
   */
  @Property({ fieldName: 'assessment_id', type: 'uuid' }) // FK → education.assessments
  assessmentId!: string;

  /**
   * Identificador asociado a enrollment.
   */
  @Property({ fieldName: 'enrollment_id', type: 'uuid' }) // FK → education.enrollments
  enrollmentId!: string;

  /**
   * Valor de attempt number mantenido por la instancia.
   */
  @Property({ fieldName: 'attempt_number', columnType: 'int' })
  attemptNumber!: number;

  /**
   * Valor de score mantenido por la instancia.
   */
  @Property({ columnType: 'numeric', nullable: true })
  score?: string;

  /**
   * Valor de passed mantenido por la instancia.
   */
  @Property({ type: 'boolean', nullable: true })
  passed?: boolean;

  /**
   * Valor de responses json mantenido por la instancia.
   */
  @Property({
    fieldName: 'responses_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  responsesJson?: unknown;

  /**
   * Valor de started at mantenido por la instancia.
   */
  @Property({
    fieldName: 'started_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startedAt?: Date;

  /**
   * Valor de submitted at mantenido por la instancia.
   */
  @Property({
    fieldName: 'submitted_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  submittedAt?: Date;

  /**
   * Identificador asociado a graded by user.
   */
  @Property({ fieldName: 'graded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  gradedByUserId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
