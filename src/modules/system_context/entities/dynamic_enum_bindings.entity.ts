import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'system_context', tableName: 'dynamic_enum_bindings' })
export class DynamicEnumBindings {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'dynamic_enum_definition_id', type: 'uuid' }) // FK → system_context.dynamic_enum_definitions
  dynamicEnumDefinitionId!: string;

  @Property({ fieldName: 'target_schema_name', columnType: 'varchar' })
  targetSchemaName!: string;

  @Property({ fieldName: 'target_entity_name', columnType: 'varchar' })
  targetEntityName!: string;

  @Property({ fieldName: 'target_field_name', columnType: 'varchar' })
  targetFieldName!: string;

  @Property({ fieldName: 'system_context_id', type: 'uuid', nullable: true }) // FK → system_context.system_contexts
  systemContextId?: string;

  @Property({ type: 'boolean', nullable: true })
  required?: boolean;

  @Property({ fieldName: 'fallback_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  fallbackConceptId?: string;

  @Property({
    fieldName: 'validation_mode_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  validationModeConceptId?: string;

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
