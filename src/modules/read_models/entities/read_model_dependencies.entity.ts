import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'read_models', tableName: 'read_model_dependencies' })
export class ReadModelDependencies {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'read_model_definition_id', type: 'uuid' }) // FK → read_models.read_model_definitions
  readModelDefinitionId!: string;

  @Property({ fieldName: 'source_schema_name', columnType: 'varchar' })
  sourceSchemaName!: string;

  @Property({ fieldName: 'source_object_name', columnType: 'varchar' })
  sourceObjectName!: string;

  @Property({ fieldName: 'dependency_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  dependencyTypeConceptId!: string;

  @Property({
    fieldName: 'selected_columns_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  selectedColumnsJson?: unknown;

  @Property({
    fieldName: 'filtering_rule_summary',
    columnType: 'text',
    nullable: true,
  })
  filteringRuleSummary?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
