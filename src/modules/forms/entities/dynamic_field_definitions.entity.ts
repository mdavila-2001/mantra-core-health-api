import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'forms', tableName: 'dynamic_field_definitions' })
export class DynamicFieldDefinitions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({
    fieldName: 'data_type',
    columnType: '"terminology"."technical_data_type"',
  })
  dataType!: string;

  @Property({ fieldName: 'data_use_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  dataUseConceptId?: string;

  @Property({
    fieldName: 'sensitivity_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  sensitivityConceptId?: string;

  @Property({ fieldName: 'semantic_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  semanticConceptId?: string;

  @Property({ fieldName: 'value_set_id', type: 'uuid', nullable: true }) // FK → terminology.value_sets
  valueSetId?: string;

  @Property({ fieldName: 'unit_value_set_id', type: 'uuid', nullable: true }) // FK → terminology.value_sets
  unitValueSetId?: string;

  @Property({ fieldName: 'cardinality_min', columnType: 'int', nullable: true })
  cardinalityMin?: number;

  @Property({ fieldName: 'cardinality_max', columnType: 'int', nullable: true })
  cardinalityMax?: number;

  @Property({ fieldName: 'length_min', columnType: 'int', nullable: true })
  lengthMin?: number;

  @Property({ fieldName: 'length_max', columnType: 'int', nullable: true })
  lengthMax?: number;

  @Property({ fieldName: 'num_precision', columnType: 'int', nullable: true })
  numPrecision?: number;

  @Property({ fieldName: 'num_scale', columnType: 'int', nullable: true })
  numScale?: number;

  @Property({
    fieldName: 'min_value_decimal',
    columnType: 'numeric',
    nullable: true,
  })
  minValueDecimal?: string;

  @Property({
    fieldName: 'max_value_decimal',
    columnType: 'numeric',
    nullable: true,
  })
  maxValueDecimal?: string;

  @Property({ columnType: 'text', nullable: true })
  regex?: string;

  @Property({
    fieldName: 'default_value_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  defaultValueJson?: unknown;

  @Property({ fieldName: 'keeps_history', type: 'boolean', nullable: true })
  keepsHistory?: boolean;

  @Property({ type: 'boolean', nullable: true })
  computed?: boolean;

  @Property({
    fieldName: 'computation_expression',
    columnType: 'text',
    nullable: true,
  })
  computationExpression?: string;

  @Property({ fieldName: 'fhir_path', columnType: 'varchar', nullable: true })
  fhirPath?: string;

  @Property({
    fieldName: 'fhir_extension_url',
    columnType: 'text',
    nullable: true,
  })
  fhirExtensionUrl?: string;

  @Property({ fieldName: 'schema_version', columnType: 'int', nullable: true })
  schemaVersion?: number;

  @Property({ fieldName: 'state_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  stateConceptId?: string;

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
