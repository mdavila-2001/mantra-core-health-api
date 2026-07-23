import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'read_models', tableName: 'frontend_view_fields' })
export class FrontendViewFields {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'frontend_page_view_id', type: 'uuid' }) // FK → read_models.frontend_page_views
  frontendPageViewId!: string;

  @Property({ fieldName: 'field_code', columnType: 'varchar' })
  fieldCode!: string;

  @Property({ fieldName: 'source_column', columnType: 'varchar' })
  sourceColumn!: string;

  @Property({ columnType: 'varchar' })
  label!: string;

  @Property({
    fieldName: 'data_type',
    columnType: '"terminology"."technical_data_type"',
  })
  dataType!: string;

  @Property({
    fieldName: 'display_component_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  displayComponentConceptId?: string;

  @Property({ fieldName: 'format_mask', columnType: 'varchar', nullable: true })
  formatMask?: string;

  @Property({
    fieldName: 'responsive_priority',
    columnType: 'int',
    nullable: true,
  })
  responsivePriority?: number;

  @Property({ type: 'boolean', nullable: true })
  sortable?: boolean;

  @Property({ type: 'boolean', nullable: true })
  filterable?: boolean;

  @Property({ type: 'boolean', nullable: true })
  searchable?: boolean;

  @Property({ type: 'boolean', nullable: true })
  sensitive?: boolean;

  @Property({ fieldName: 'permission_id', type: 'uuid', nullable: true }) // FK → authz.permissions
  permissionId?: string;

  @Property({
    fieldName: 'empty_display_text',
    columnType: 'varchar',
    nullable: true,
  })
  emptyDisplayText?: string;

  @Property({
    fieldName: 'metadata_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  metadataJson?: unknown;

  @Property({ columnType: 'int' })
  ordinal!: number;

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
