import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `certificates`.
 */
@Entity({ schema: 'education', tableName: 'certificates' })
export class Certificates {
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
   * Identificador asociado a course.
   */
  @Property({ fieldName: 'course_id', type: 'uuid' }) // FK → education.courses
  courseId!: string;

  /**
   * Valor de certificate number mantenido por la instancia.
   */
  @Property({ fieldName: 'certificate_number', columnType: 'varchar' })
  certificateNumber!: string;

  /**
   * Identificador asociado a learner ref.
   */
  @Property({ fieldName: 'learner_ref_id', type: 'uuid', nullable: true })
  learnerRefId?: string;

  /**
   * Valor de cme credits awarded mantenido por la instancia.
   */
  @Property({
    fieldName: 'cme_credits_awarded',
    columnType: 'numeric',
    nullable: true,
  })
  cmeCreditsAwarded?: string;

  /**
   * Valor de issued at mantenido por la instancia.
   */
  @Property({
    fieldName: 'issued_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  issuedAt?: Date;

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
   * Valor de verification code mantenido por la instancia.
   */
  @Property({
    fieldName: 'verification_code',
    columnType: 'varchar',
    nullable: true,
  })
  verificationCode?: string;

  /**
   * Identificador asociado a file.
   */
  @Property({ fieldName: 'file_id', type: 'uuid', nullable: true }) // FK → common.files
  fileId?: string;

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
