import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Respuesta individual a una pregunta de encuesta post-visita.
 *
 * Se mantiene privada (spec 5547): la organización consulta indicadores
 * agregados y exportaciones anonimizadas, nunca esta tabla directamente.
 */
@Entity({ schema: 'pharma_lab', tableName: 'visit_survey_answers' })
export class VisitSurveyAnswers {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Envío al que pertenece.
   */
  @Property({ fieldName: 'visit_survey_response_id', type: 'uuid' }) // FK → pharma_lab.visit_survey_responses
  visitSurveyResponseId!: string;

  /**
   * Pregunta respondida.
   */
  @Property({ fieldName: 'visit_survey_question_id', type: 'uuid' }) // FK → pharma_lab.visit_survey_questions
  visitSurveyQuestionId!: string;

  /**
   * Respuesta numérica, para preguntas de escala.
   */
  @Property({ fieldName: 'numeric_value', columnType: 'int', nullable: true })
  numericValue?: number;

  /**
   * Respuesta booleana.
   */
  @Property({ fieldName: 'boolean_value', type: 'boolean', nullable: true })
  booleanValue?: boolean;

  /**
   * Respuesta libre o la opción elegida.
   */
  @Property({ fieldName: 'text_value', columnType: 'text', nullable: true })
  textValue?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
