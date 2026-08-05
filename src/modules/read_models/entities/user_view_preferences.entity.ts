import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `user_view_preferences`.
 */
@Entity({ schema: 'read_models', tableName: 'user_view_preferences' })
export class UserViewPreferences {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a user.
   */
  @Property({ fieldName: 'user_id', type: 'uuid' }) // FK → iam.users
  userId!: string;

  /**
   * Identificador asociado a frontend page view.
   */
  @Property({ fieldName: 'frontend_page_view_id', type: 'uuid' }) // FK → read_models.frontend_page_views
  frontendPageViewId!: string;

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  /**
   * Valor de visible fields json mantenido por la instancia.
   */
  @Property({
    fieldName: 'visible_fields_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  visibleFieldsJson?: unknown;

  /**
   * Valor de field order json mantenido por la instancia.
   */
  @Property({
    fieldName: 'field_order_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  fieldOrderJson?: unknown;

  /**
   * Valor de active filter json mantenido por la instancia.
   */
  @Property({
    fieldName: 'active_filter_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  activeFilterJson?: unknown;

  /**
   * Valor de sort code mantenido por la instancia.
   */
  @Property({ fieldName: 'sort_code', columnType: 'varchar', nullable: true })
  sortCode?: string;

  /**
   * Identificador asociado a density concept.
   */
  @Property({ fieldName: 'density_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  densityConceptId?: string;

  /**
   * Valor de page size mantenido por la instancia.
   */
  @Property({ fieldName: 'page_size', columnType: 'int', nullable: true })
  pageSize?: number;

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
