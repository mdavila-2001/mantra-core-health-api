import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'forms', tableName: 'field_values' })
export class FieldValues {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'form_instance_id', type: 'uuid' }) // FK → forms.form_instances
  formInstanceId!: string;

  @Property({ fieldName: 'resource_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  resourceTypeConceptId!: string;

  @Property({ fieldName: 'resource_id', type: 'uuid' })
  resourceId!: string;

  @Property({ fieldName: 'field_id', type: 'uuid' }) // FK (destino no resuelto)
  fieldId!: string;

  @Property({ fieldName: 'assignment_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  assignmentId?: string;

  @Property({ fieldName: 'instance_group_id', type: 'uuid', nullable: true })
  instanceGroupId?: string;

  @Property({ columnType: 'int' })
  ordinal!: number;

  @Property({
    fieldName: 'value_string',
    columnType: 'varchar',
    nullable: true,
  })
  valueString?: string;

  @Property({ fieldName: 'value_text', columnType: 'text', nullable: true })
  valueText?: string;

  @Property({ fieldName: 'value_integer', type: 'bigint', nullable: true })
  valueInteger?: string;

  @Property({
    fieldName: 'value_decimal',
    columnType: 'numeric',
    nullable: true,
  })
  valueDecimal?: string;

  @Property({ fieldName: 'value_boolean', type: 'boolean', nullable: true })
  valueBoolean?: boolean;

  @Property({ fieldName: 'value_date', columnType: 'date', nullable: true })
  valueDate?: Date;

  @Property({
    fieldName: 'value_datetime',
    columnType: 'timestamptz',
    nullable: true,
  })
  valueDatetime?: Date;

  @Property({ fieldName: 'value_time', columnType: 'time', nullable: true })
  valueTime?: string;

  @Property({ fieldName: 'value_url', columnType: 'text', nullable: true })
  valueUrl?: string;

  @Property({
    fieldName: 'value_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  valueJson?: unknown;

  @Property({ fieldName: 'value_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  valueConceptId?: string;

  @Property({
    fieldName: 'value_reference_type',
    columnType: 'varchar',
    nullable: true,
  })
  valueReferenceType?: string;

  @Property({ fieldName: 'value_reference_id', type: 'uuid', nullable: true })
  valueReferenceId?: string;

  @Property({ fieldName: 'file_id', type: 'uuid', nullable: true }) // FK → common.files
  fileId?: string;

  @Property({ fieldName: 'unit_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  unitConceptId?: string;

  @Property({
    fieldName: 'data_source_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  dataSourceConceptId?: string;

  @Property({
    fieldName: 'value_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  valueStatusConceptId?: string;

  @Property({
    fieldName: 'effective_from',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveFrom?: Date;

  @Property({
    fieldName: 'effective_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveTo?: Date;

  @Property({ fieldName: 'value_version', columnType: 'int', nullable: true })
  valueVersion?: number;

  @Property({ fieldName: 'supersedes_value_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  supersedesValueId?: string;

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
