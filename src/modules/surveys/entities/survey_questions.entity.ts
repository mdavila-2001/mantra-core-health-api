import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `survey_questions`.
 *
 * La pregunta pertenece a una **versión**, no a la plantilla: es lo que hace
 * que publicar congele el cuestionario. `required` cubre el requisito de
 * ALOVIDA «definir si una pregunta es obligatoria u opcional».
 */
@Entity({ schema: 'surveys', tableName: 'survey_questions' })
export class SurveyQuestions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a survey version.
   */
  @Property({ fieldName: 'survey_version_id', type: 'uuid' }) // FK → surveys.survey_versions
  surveyVersionId!: string;

  /**
   * Posición de la pregunta dentro del cuestionario, arrancando en 1.
   */
  @Property({ fieldName: 'position', columnType: 'int' })
  position!: number;

  /**
   * Enunciado que lee el paciente.
   */
  @Property({ fieldName: 'question_text', columnType: 'text' })
  questionText!: string;

  /**
   * Identificador asociado a answer type concept.
   */
  @Property({ fieldName: 'answer_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  answerTypeConceptId!: string;

  /**
   * Si responderla es obligatorio para poder enviar el cuestionario.
   */
  @Property({ fieldName: 'required', columnType: 'boolean' })
  required!: boolean;

  /**
   * Opciones de las preguntas de elección, en orden de presentación. Nulo para
   * los tipos que no las admiten (texto, escala, sí/no).
   */
  @Property({
    fieldName: 'options',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  options?: string[];

  /**
   * Mínimo admitido en las preguntas de escala. Nulo en el resto.
   */
  @Property({ fieldName: 'scale_min', columnType: 'int', nullable: true })
  scaleMin?: number;

  /**
   * Máximo admitido en las preguntas de escala. Nulo en el resto.
   */
  @Property({ fieldName: 'scale_max', columnType: 'int', nullable: true })
  scaleMax?: number;

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
