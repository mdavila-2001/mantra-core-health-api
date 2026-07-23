import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'read_models', tableName: 'frontend_page_views' })
export class FrontendPageViews {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'frontend_route_id', type: 'uuid' }) // FK → read_models.frontend_routes
  frontendRouteId!: string;

  @Property({ fieldName: 'read_model_definition_id', type: 'uuid' }) // FK → read_models.read_model_definitions
  readModelDefinitionId!: string;

  @Property({ fieldName: 'view_code', columnType: 'varchar' })
  viewCode!: string;

  @Property({ fieldName: 'view_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  viewTypeConceptId!: string;

  @Property({ columnType: 'varchar', nullable: true })
  title?: string;

  @Property({ columnType: 'text', nullable: true })
  description?: string;

  @Property({ fieldName: 'field_mask_policy_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  fieldMaskPolicyId?: string;

  @Property({
    fieldName: 'default_sort_code',
    columnType: 'varchar',
    nullable: true,
  })
  defaultSortCode?: string;

  @Property({
    fieldName: 'polling_interval_seconds',
    columnType: 'int',
    nullable: true,
  })
  pollingIntervalSeconds?: number;

  @Property({
    fieldName: 'supports_cursor_pagination',
    type: 'boolean',
    nullable: true,
  })
  supportsCursorPagination?: boolean;

  @Property({ fieldName: 'supports_export', type: 'boolean', nullable: true })
  supportsExport?: boolean;

  @Property({
    fieldName: 'supports_saved_filters',
    type: 'boolean',
    nullable: true,
  })
  supportsSavedFilters?: boolean;

  @Property({
    fieldName: 'layout_spec_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  layoutSpecJson?: unknown;

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
