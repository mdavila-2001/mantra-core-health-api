import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `assessment_questions`.
 */
@Entity({ schema: 'education', tableName: 'assessment_questions' })
export class AssessmentQuestions {
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
   * Identificador asociado a question type concept.
   */
  @Property({ fieldName: 'question_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  questionTypeConceptId!: string;

  /**
   * Valor de prompt text mantenido por la instancia.
   */
  @Property({ fieldName: 'prompt_text', columnType: 'text' })
  promptText!: string;

  /**
   * Valor de options json mantenido por la instancia.
   */
  @Property({
    fieldName: 'options_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  optionsJson?: unknown;

  /**
   * Valor de correct answer json mantenido por la instancia.
   */
  @Property({
    fieldName: 'correct_answer_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  correctAnswerJson?: unknown;

  /**
   * Valor de points mantenido por la instancia.
   */
  @Property({ columnType: 'numeric', nullable: true })
  points?: string;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @Property({ columnType: 'int', nullable: true })
  ordinal?: number;

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
