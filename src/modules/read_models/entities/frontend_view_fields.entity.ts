import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `frontend_view_fields`.
 */
@Entity({ schema: 'read_models', tableName: 'frontend_view_fields' })
export class FrontendViewFields {
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
   * Valor de field code mantenido por la instancia.
   */
  @Property({ fieldName: 'field_code', columnType: 'varchar' })
  fieldCode!: string;

  /**
   * Valor de source column mantenido por la instancia.
   */
  @Property({ fieldName: 'source_column', columnType: 'varchar' })
  sourceColumn!: string;

  /**
   * Valor de label mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  label!: string;

  /**
   * Valor de data type mantenido por la instancia.
   */
  @Property({
    fieldName: 'data_type',
    columnType: 'terminology.technical_data_type',
  })
  dataType!: string;

  /**
   * Identificador asociado a display component concept.
   */
  @Property({
    fieldName: 'display_component_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  displayComponentConceptId?: string;

  /**
   * Valor de format mask mantenido por la instancia.
   */
  @Property({ fieldName: 'format_mask', columnType: 'varchar', nullable: true })
  formatMask?: string;

  /**
   * Valor de responsive priority mantenido por la instancia.
   */
  @Property({
    fieldName: 'responsive_priority',
    columnType: 'int',
    nullable: true,
  })
  responsivePriority?: number;

  /**
   * Valor de sortable mantenido por la instancia.
   */
  @Property({ type: 'boolean', nullable: true })
  sortable?: boolean;

  /**
   * Valor de filterable mantenido por la instancia.
   */
  @Property({ type: 'boolean', nullable: true })
  filterable?: boolean;

  /**
   * Valor de searchable mantenido por la instancia.
   */
  @Property({ type: 'boolean', nullable: true })
  searchable?: boolean;

  /**
   * Valor de sensitive mantenido por la instancia.
   */
  @Property({ type: 'boolean', nullable: true })
  sensitive?: boolean;

  /**
   * Identificador asociado a permission.
   */
  @Property({ fieldName: 'permission_id', type: 'uuid', nullable: true }) // FK → authz.permissions
  permissionId?: string;

  /**
   * Valor de empty display text mantenido por la instancia.
   */
  @Property({
    fieldName: 'empty_display_text',
    columnType: 'varchar',
    nullable: true,
  })
  emptyDisplayText?: string;

  /**
   * Valor de metadata json mantenido por la instancia.
   */
  @Property({
    fieldName: 'metadata_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  metadataJson?: unknown;

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
