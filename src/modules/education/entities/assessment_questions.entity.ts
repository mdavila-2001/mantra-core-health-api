import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'education', tableName: 'assessment_questions' })
export class AssessmentQuestions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'assessment_id', type: 'uuid' }) // FK → education.assessments
  assessmentId!: string;

  @Property({ fieldName: 'question_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  questionTypeConceptId!: string;

  @Property({ fieldName: 'prompt_text', columnType: 'text' })
  promptText!: string;

  @Property({
    fieldName: 'options_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  optionsJson?: unknown;

  @Property({
    fieldName: 'correct_answer_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  correctAnswerJson?: unknown;

  @Property({ columnType: 'numeric', nullable: true })
  points?: string;

  @Property({ columnType: 'int', nullable: true })
  ordinal?: number;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
