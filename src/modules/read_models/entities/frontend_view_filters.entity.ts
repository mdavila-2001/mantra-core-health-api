import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `frontend_view_filters`.
 */
@Entity({ schema: 'read_models', tableName: 'frontend_view_filters' })
export class FrontendViewFilters {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a frontend page view.
   */
  @Property({ fieldName: 'frontend_page_view_id', type: 'uuid' }) // FK → read_models.frontend_page_views
  frontendPageViewId!: string;

  /**
   * Valor de filter code mantenido por la instancia.
   */
  @Property({ fieldName: 'filter_code', columnType: 'varchar' })
  filterCode!: string;

  /**
   * Valor de label mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  label!: string;

  /**
   * Identificador asociado a operator value set.
   */
  @Property({ fieldName: 'operator_value_set_id', type: 'uuid' }) // FK → terminology.value_sets
  operatorValueSetId!: string;

  /**
   * Identificador asociado a input type concept.
   */
  @Property({ fieldName: 'input_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  inputTypeConceptId!: string;

  /**
   * Identificador asociado a value set.
   */
  @Property({ fieldName: 'value_set_id', type: 'uuid', nullable: true }) // FK → terminology.value_sets
  valueSetId?: string;

  /**
   * Identificador asociado a dynamic enum definition.
   */
  @Property({
    fieldName: 'dynamic_enum_definition_id',
    type: 'uuid',
    nullable: true,
  }) // FK → system_context.dynamic_enum_definitions
  dynamicEnumDefinitionId?: string;

  /**
   * Valor de source column mantenido por la instancia.
   */
  @Property({
    fieldName: 'source_column',
    columnType: 'varchar',
    nullable: true,
  })
  sourceColumn?: string;

  /**
   * Valor de default value json mantenido por la instancia.
   */
  @Property({
    fieldName: 'default_value_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  defaultValueJson?: unknown;

  /**
   * Valor de required mantenido por la instancia.
   */
  @Property({ type: 'boolean', nullable: true })
  required?: boolean;

  /**
   * Valor de url parameter name mantenido por la instancia.
   */
  @Property({
    fieldName: 'url_parameter_name',
    columnType: 'varchar',
    nullable: true,
  })
  urlParameterName?: string;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @Property({ columnType: 'int' })
  ordinal!: number;

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
