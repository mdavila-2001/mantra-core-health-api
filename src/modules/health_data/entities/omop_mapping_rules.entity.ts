import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'health_data', tableName: 'omop_mapping_rules' })
export class OmopMappingRules {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'omop_mapping_set_id', type: 'uuid' }) // FK → health_data.omop_mapping_sets
  omopMappingSetId!: string;

  @Property({ fieldName: 'source_resource_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  sourceResourceTypeConceptId!: string;

  @Property({ fieldName: 'target_table', columnType: 'varchar' })
  targetTable!: string;

  @Property({ fieldName: 'target_column', columnType: 'varchar' })
  targetColumn!: string;

  @Property({ fieldName: 'mapping_expression', columnType: 'text' })
  mappingExpression!: string;

  @Property({
    fieldName: 'vocabulary_mapping_set_id',
    type: 'uuid',
    nullable: true,
  }) // FK → health_data.omop_mapping_sets
  vocabularyMappingSetId?: string;

  @Property({ type: 'boolean', nullable: true })
  required?: boolean;

  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

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
