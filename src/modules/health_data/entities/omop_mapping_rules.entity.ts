import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `omop_mapping_rules`.
 */
@Entity({ schema: 'health_data', tableName: 'omop_mapping_rules' })
export class OmopMappingRules {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a omop mapping set.
   */
  @Property({ fieldName: 'omop_mapping_set_id', type: 'uuid' }) // FK → health_data.omop_mapping_sets
  omopMappingSetId!: string;

  /**
   * Identificador asociado a source resource type concept.
   */
  @Property({ fieldName: 'source_resource_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  sourceResourceTypeConceptId!: string;

  /**
   * Valor de target table mantenido por la instancia.
   */
  @Property({ fieldName: 'target_table', columnType: 'varchar' })
  targetTable!: string;

  /**
   * Valor de target column mantenido por la instancia.
   */
  @Property({ fieldName: 'target_column', columnType: 'varchar' })
  targetColumn!: string;

  /**
   * Valor de mapping expression mantenido por la instancia.
   */
  @Property({ fieldName: 'mapping_expression', columnType: 'text' })
  mappingExpression!: string;

  /**
   * Identificador asociado a vocabulary mapping set.
   */
  @Property({
    fieldName: 'vocabulary_mapping_set_id',
    type: 'uuid',
    nullable: true,
  }) // FK → health_data.omop_mapping_sets
  vocabularyMappingSetId?: string;

  /**
   * Valor de required mantenido por la instancia.
   */
  @Property({ type: 'boolean', nullable: true })
  required?: boolean;

  /**
   * Identificador asociado a state concept.
   */
  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

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
