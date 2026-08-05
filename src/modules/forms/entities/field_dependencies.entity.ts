import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `field_dependencies`.
 */
@Entity({ schema: 'forms', tableName: 'field_dependencies' })
export class FieldDependencies {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a target field.
   */
  @Property({ fieldName: 'target_field_id', type: 'uuid' }) // FK → forms.dynamic_field_definitions
  targetFieldId!: string;

  /**
   * Identificador asociado a source field.
   */
  @Property({ fieldName: 'source_field_id', type: 'uuid' }) // FK → forms.dynamic_field_definitions
  sourceFieldId!: string;

  /**
   * Identificador asociado a operator concept.
   */
  @Property({ fieldName: 'operator_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  operatorConceptId!: string;

  /**
   * Valor de comparison value json mantenido por la instancia.
   */
  @Property({
    fieldName: 'comparison_value_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  comparisonValueJson?: unknown;

  /**
   * Identificador asociado a behavior concept.
   */
  @Property({ fieldName: 'behavior_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  behaviorConceptId!: string;

  /**
   * Valor de logical group mantenido por la instancia.
   */
  @Property({
    fieldName: 'logical_group',
    columnType: 'varchar',
    nullable: true,
  })
  logicalGroup?: string;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @Property({ columnType: 'int', nullable: true })
  ordinal?: number;

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
