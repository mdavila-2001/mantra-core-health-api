import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'polyglot_storage', tableName: 'data_access_policies' })
export class DataAccessPolicies {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'dataset_definition_id', type: 'uuid' }) // FK → polyglot_storage.dataset_definitions
  datasetDefinitionId!: string;

  @Property({ fieldName: 'purpose_of_use_code', columnType: 'varchar' })
  purposeOfUseCode!: string;

  @Property({ fieldName: 'principal_type', columnType: 'varchar' })
  principalType!: string;

  @Property({
    fieldName: 'field_policy_json',
    type: 'json',
    columnType: 'jsonb',
  })
  fieldPolicyJson!: unknown;

  @Property({ fieldName: 'row_filter_expression', columnType: 'text' })
  rowFilterExpression!: string;

  @Property({ fieldName: 'masking_profile_code', columnType: 'varchar' })
  maskingProfileCode!: string;

  @Property({ columnType: 'varchar' })
  state!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
