import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `frontend_page_views`.
 */
@Entity({ schema: 'read_models', tableName: 'frontend_page_views' })
export class FrontendPageViews {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a frontend route.
   */
  @Property({ fieldName: 'frontend_route_id', type: 'uuid' }) // FK → read_models.frontend_routes
  frontendRouteId!: string;

  /**
   * Identificador asociado a read model definition.
   */
  @Property({ fieldName: 'read_model_definition_id', type: 'uuid' }) // FK → read_models.read_model_definitions
  readModelDefinitionId!: string;

  /**
   * Valor de view code mantenido por la instancia.
   */
  @Property({ fieldName: 'view_code', columnType: 'varchar' })
  viewCode!: string;

  /**
   * Identificador asociado a view type concept.
   */
  @Property({ fieldName: 'view_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  viewTypeConceptId!: string;

  /**
   * Valor de title mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  title?: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  description?: string;

  /**
   * Identificador asociado a field mask policy.
   */
  @Property({ fieldName: 'field_mask_policy_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  fieldMaskPolicyId?: string;

  /**
   * Valor de default sort code mantenido por la instancia.
   */
  @Property({
    fieldName: 'default_sort_code',
    columnType: 'varchar',
    nullable: true,
  })
  defaultSortCode?: string;

  /**
   * Valor de polling interval seconds mantenido por la instancia.
   */
  @Property({
    fieldName: 'polling_interval_seconds',
    columnType: 'int',
    nullable: true,
  })
  pollingIntervalSeconds?: number;

  /**
   * Valor de supports cursor pagination mantenido por la instancia.
   */
  @Property({
    fieldName: 'supports_cursor_pagination',
    type: 'boolean',
    nullable: true,
  })
  supportsCursorPagination?: boolean;

  /**
   * Valor de supports export mantenido por la instancia.
   */
  @Property({ fieldName: 'supports_export', type: 'boolean', nullable: true })
  supportsExport?: boolean;

  /**
   * Valor de supports saved filters mantenido por la instancia.
   */
  @Property({
    fieldName: 'supports_saved_filters',
    type: 'boolean',
    nullable: true,
  })
  supportsSavedFilters?: boolean;

  /**
   * Valor de layout spec json mantenido por la instancia.
   */
  @Property({
    fieldName: 'layout_spec_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  layoutSpecJson?: unknown;

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
