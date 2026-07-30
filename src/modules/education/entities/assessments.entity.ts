import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `assessments`.
 */
@Entity({ schema: 'education', tableName: 'assessments' })
export class Assessments {
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
   * Identificador asociado a course module.
   */
  @Property({ fieldName: 'course_module_id', type: 'uuid', nullable: true }) // FK → education.course_modules
  courseModuleId?: string;

  /**
   * Valor de title mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  title!: string;

  /**
   * Identificador asociado a assessment type concept.
   */
  @Property({ fieldName: 'assessment_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  assessmentTypeConceptId!: string;

  /**
   * Valor de passing score mantenido por la instancia.
   */
  @Property({
    fieldName: 'passing_score',
    columnType: 'numeric',
    nullable: true,
  })
  passingScore?: string;

  /**
   * Valor de max attempts mantenido por la instancia.
   */
  @Property({ fieldName: 'max_attempts', columnType: 'int', nullable: true })
  maxAttempts?: number;

  /**
   * Valor de time limit minutes mantenido por la instancia.
   */
  @Property({
    fieldName: 'time_limit_minutes',
    columnType: 'int',
    nullable: true,
  })
  timeLimitMinutes?: number;

  /**
   * Valor de is graded mantenido por la instancia.
   */
  @Property({ fieldName: 'is_graded', type: 'boolean', nullable: true })
  isGraded?: boolean;

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
