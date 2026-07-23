import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'read_models', tableName: 'frontend_view_filters' })
export class FrontendViewFilters {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'frontend_page_view_id', type: 'uuid' }) // FK → read_models.frontend_page_views
  frontendPageViewId!: string;

  @Property({ fieldName: 'filter_code', columnType: 'varchar' })
  filterCode!: string;

  @Property({ columnType: 'varchar' })
  label!: string;

  @Property({ fieldName: 'operator_value_set_id', type: 'uuid' }) // FK → terminology.value_sets
  operatorValueSetId!: string;

  @Property({ fieldName: 'input_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  inputTypeConceptId!: string;

  @Property({ fieldName: 'value_set_id', type: 'uuid', nullable: true }) // FK → terminology.value_sets
  valueSetId?: string;

  @Property({
    fieldName: 'dynamic_enum_definition_id',
    type: 'uuid',
    nullable: true,
  }) // FK → system_context.dynamic_enum_definitions
  dynamicEnumDefinitionId?: string;

  @Property({
    fieldName: 'source_column',
    columnType: 'varchar',
    nullable: true,
  })
  sourceColumn?: string;

  @Property({
    fieldName: 'default_value_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  defaultValueJson?: unknown;

  @Property({ type: 'boolean', nullable: true })
  required?: boolean;

  @Property({
    fieldName: 'url_parameter_name',
    columnType: 'varchar',
    nullable: true,
  })
  urlParameterName?: string;

  @Property({ columnType: 'int' })
  ordinal!: number;

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
