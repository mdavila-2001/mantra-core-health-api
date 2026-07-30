import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `read_model_dependencies`.
 */
@Entity({ schema: 'read_models', tableName: 'read_model_dependencies' })
export class ReadModelDependencies {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a read model definition.
   */
  @Property({ fieldName: 'read_model_definition_id', type: 'uuid' }) // FK → read_models.read_model_definitions
  readModelDefinitionId!: string;

  /**
   * Valor de source schema name mantenido por la instancia.
   */
  @Property({ fieldName: 'source_schema_name', columnType: 'varchar' })
  sourceSchemaName!: string;

  /**
   * Valor de source object name mantenido por la instancia.
   */
  @Property({ fieldName: 'source_object_name', columnType: 'varchar' })
  sourceObjectName!: string;

  /**
   * Identificador asociado a dependency type concept.
   */
  @Property({ fieldName: 'dependency_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  dependencyTypeConceptId!: string;

  /**
   * Valor de selected columns json mantenido por la instancia.
   */
  @Property({
    fieldName: 'selected_columns_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  selectedColumnsJson?: unknown;

  /**
   * Valor de filtering rule summary mantenido por la instancia.
   */
  @Property({
    fieldName: 'filtering_rule_summary',
    columnType: 'text',
    nullable: true,
  })
  filteringRuleSummary?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
