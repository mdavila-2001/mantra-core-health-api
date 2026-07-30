import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `dynamic_enum_bindings`.
 */
@Entity({ schema: 'system_context', tableName: 'dynamic_enum_bindings' })
export class DynamicEnumBindings {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a dynamic enum definition.
   */
  @Property({ fieldName: 'dynamic_enum_definition_id', type: 'uuid' }) // FK → system_context.dynamic_enum_definitions
  dynamicEnumDefinitionId!: string;

  /**
   * Valor de target schema name mantenido por la instancia.
   */
  @Property({ fieldName: 'target_schema_name', columnType: 'varchar' })
  targetSchemaName!: string;

  /**
   * Valor de target entity name mantenido por la instancia.
   */
  @Property({ fieldName: 'target_entity_name', columnType: 'varchar' })
  targetEntityName!: string;

  /**
   * Valor de target field name mantenido por la instancia.
   */
  @Property({ fieldName: 'target_field_name', columnType: 'varchar' })
  targetFieldName!: string;

  /**
   * Identificador asociado a system context.
   */
  @Property({ fieldName: 'system_context_id', type: 'uuid', nullable: true }) // FK → system_context.system_contexts
  systemContextId?: string;

  /**
   * Valor de required mantenido por la instancia.
   */
  @Property({ type: 'boolean', nullable: true })
  required?: boolean;

  /**
   * Identificador asociado a fallback concept.
   */
  @Property({ fieldName: 'fallback_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  fallbackConceptId?: string;

  /**
   * Identificador asociado a validation mode concept.
   */
  @Property({
    fieldName: 'validation_mode_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  validationModeConceptId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
