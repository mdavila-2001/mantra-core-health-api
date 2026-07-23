import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'lead_answers' })
export class LeadAnswers {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'lead_submission_id', type: 'uuid' }) // FK → ads.lead_submissions
  leadSubmissionId!: string;

  @Property({ fieldName: 'lead_form_question_id', type: 'uuid' }) // FK → ads.lead_form_questions
  leadFormQuestionId!: string;

  @Property({
    fieldName: 'answer_text_encrypted',
    columnType: 'text',
    nullable: true,
  })
  answerTextEncrypted?: string;

  @Property({
    fieldName: 'answer_json_encrypted',
    columnType: 'text',
    nullable: true,
  })
  answerJsonEncrypted?: string;

  @Property({
    fieldName: 'normalized_value_hash',
    columnType: 'varchar',
    nullable: true,
  })
  normalizedValueHash?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
