import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Pregunta de una encuesta post-visita (spec 5536-5539).
 */
@Entity({ schema: 'pharma_lab', tableName: 'visit_survey_questions' })
export class VisitSurveyQuestions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Encuesta a la que pertenece.
   */
  @Property({ fieldName: 'visit_survey_id', type: 'uuid' }) // FK → pharma_lab.visit_surveys
  visitSurveyId!: string;

  /**
   * Orden de presentación.
   */
  @Property({ fieldName: 'position', columnType: 'int' })
  position!: number;

  /**
   * Enunciado.
   */
  @Property({ fieldName: 'prompt', columnType: 'text' })
  prompt!: string;

  /**
   * Tipo de respuesta esperada.
   */
  @Property({ fieldName: 'answer_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  answerTypeConceptId!: string;

  /**
   * Si la respuesta es obligatoria.
   */
  @Property({ fieldName: 'is_required', type: 'boolean' })
  isRequired: boolean = false;

  /**
   * Opciones, cuando el tipo de respuesta es de opción única.
   */
  @Property({ type: 'json', columnType: 'jsonb', nullable: true })
  options?: string[];

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
