import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'reporting', tableName: 'report_parameters' })
export class ReportParameters {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'report_definition_id', type: 'uuid' }) // FK → reporting.report_definitions
  reportDefinitionId!: string;

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({
    fieldName: 'data_type',
    columnType: 'terminology.technical_data_type',
  })
  dataType!: string;

  @Property({ type: 'boolean', nullable: true })
  required?: boolean;

  @Property({
    fieldName: 'default_value_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  defaultValueJson?: unknown;

  @Property({ fieldName: 'value_set_id', type: 'uuid', nullable: true }) // FK → terminology.value_sets
  valueSetId?: string;

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
