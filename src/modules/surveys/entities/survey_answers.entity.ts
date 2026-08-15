import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `survey_answers`.
 *
 * Una fila por pregunta contestada. Sigue el mismo criterio `value[x]` que usa
 * `forms.field_values` en el resto del sistema: **una sola columna `value_*`
 * poblada por fila**, elegida por el tipo de respuesta de la pregunta. El
 * servicio lo hace cumplir al escribir; el modelo mantiene las cuatro columnas
 * nullable porque el tipo lo decide la pregunta, no la fila.
 */
@Entity({ schema: 'surveys', tableName: 'survey_answers' })
export class SurveyAnswers {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a survey response.
   */
  @Property({ fieldName: 'survey_response_id', type: 'uuid' }) // FK → surveys.survey_responses
  surveyResponseId!: string;

  /**
   * Identificador asociado a survey question.
   */
  @Property({ fieldName: 'survey_question_id', type: 'uuid' }) // FK → surveys.survey_questions
  surveyQuestionId!: string;

  /**
   * Respuesta de texto libre. Poblada solo para preguntas de tipo TEXT.
   */
  @Property({ fieldName: 'value_text', columnType: 'text', nullable: true })
  valueText?: string;

  /**
   * Respuesta numérica. Poblada solo para preguntas de tipo SCALE.
   */
  @Property({ fieldName: 'value_number', columnType: 'int', nullable: true })
  valueNumber?: number;

  /**
   * Respuesta sí/no. Poblada solo para preguntas de tipo BOOLEAN.
   */
  @Property({
    fieldName: 'value_boolean',
    columnType: 'boolean',
    nullable: true,
  })
  valueBoolean?: boolean;

  /**
   * Opciones elegidas. Poblada solo para los dos tipos de elección; la de
   * elección simple guarda un único elemento para no necesitar otra columna.
   */
  @Property({
    fieldName: 'value_choices',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  valueChoices?: string[];

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
