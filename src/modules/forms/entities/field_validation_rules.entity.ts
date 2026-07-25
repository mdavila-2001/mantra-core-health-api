import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'forms', tableName: 'field_validation_rules' })
export class FieldValidationRules {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'field_id', type: 'uuid' }) // FK → forms.dynamic_field_definitions
  fieldId!: string;

  @Property({ fieldName: 'rule_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  ruleTypeConceptId!: string;

  @Property({ fieldName: 'operator_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  operatorConceptId?: string;

  @Property({ fieldName: 'parameters_json', type: 'json', columnType: 'jsonb' })
  parametersJson!: unknown;

  @Property({
    fieldName: 'error_message',
    columnType: 'varchar',
    nullable: true,
  })
  errorMessage?: string;

  @Property({ fieldName: 'severity_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  severityConceptId?: string;

  @Property({ columnType: 'int', nullable: true })
  ordinal?: number;

  @Property({ type: 'boolean', nullable: true })
  active?: boolean;

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
