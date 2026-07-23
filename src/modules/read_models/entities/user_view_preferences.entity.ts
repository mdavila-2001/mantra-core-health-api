import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'read_models', tableName: 'user_view_preferences' })
export class UserViewPreferences {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'user_id', type: 'uuid' }) // FK → iam.users
  userId!: string;

  @Property({ fieldName: 'frontend_page_view_id', type: 'uuid' }) // FK → read_models.frontend_page_views
  frontendPageViewId!: string;

  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  @Property({
    fieldName: 'visible_fields_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  visibleFieldsJson?: unknown;

  @Property({
    fieldName: 'field_order_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  fieldOrderJson?: unknown;

  @Property({
    fieldName: 'active_filter_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  activeFilterJson?: unknown;

  @Property({ fieldName: 'sort_code', columnType: 'varchar', nullable: true })
  sortCode?: string;

  @Property({ fieldName: 'density_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  densityConceptId?: string;

  @Property({ fieldName: 'page_size', columnType: 'int', nullable: true })
  pageSize?: number;

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
