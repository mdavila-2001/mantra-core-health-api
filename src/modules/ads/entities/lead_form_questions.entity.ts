import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'lead_form_questions' })
export class LeadFormQuestions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'lead_form_id', type: 'uuid' }) // FK → ads.lead_forms
  leadFormId!: string;

  @Property({ fieldName: 'question_key', columnType: 'varchar' })
  questionKey!: string;

  @Property({ fieldName: 'question_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  questionTypeConceptId!: string;

  @Property({ columnType: 'varchar' })
  label!: string;

  @Property({
    fieldName: 'options_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  optionsJson?: unknown;

  @Property({ fieldName: 'display_order', columnType: 'int' })
  displayOrder!: number;

  @Property({ fieldName: 'is_required', type: 'boolean' })
  isRequired!: boolean;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
