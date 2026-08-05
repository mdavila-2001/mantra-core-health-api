import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `lead_answers`.
 */
@Entity({ schema: 'ads', tableName: 'lead_answers' })
export class LeadAnswers {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a lead submission.
   */
  @Property({ fieldName: 'lead_submission_id', type: 'uuid' }) // FK → ads.lead_submissions
  leadSubmissionId!: string;

  /**
   * Identificador asociado a lead form question.
   */
  @Property({ fieldName: 'lead_form_question_id', type: 'uuid' }) // FK → ads.lead_form_questions
  leadFormQuestionId!: string;

  /**
   * Valor de answer text encrypted mantenido por la instancia.
   */
  @Property({
    fieldName: 'answer_text_encrypted',
    columnType: 'text',
    nullable: true,
  })
  answerTextEncrypted?: string;

  /**
   * Valor de answer json encrypted mantenido por la instancia.
   */
  @Property({
    fieldName: 'answer_json_encrypted',
    columnType: 'text',
    nullable: true,
  })
  answerJsonEncrypted?: string;

  /**
   * Valor de normalized value hash mantenido por la instancia.
   */
  @Property({
    fieldName: 'normalized_value_hash',
    columnType: 'varchar',
    nullable: true,
  })
  normalizedValueHash?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
