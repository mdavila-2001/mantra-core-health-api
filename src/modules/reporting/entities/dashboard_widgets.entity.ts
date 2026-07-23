import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'reporting', tableName: 'dashboard_widgets' })
export class DashboardWidgets {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'dashboard_id', type: 'uuid' }) // FK → reporting.dashboards
  dashboardId!: string;

  @Property({ fieldName: 'report_definition_id', type: 'uuid', nullable: true }) // FK → reporting.report_definitions
  reportDefinitionId?: string;

  @Property({ fieldName: 'widget_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  widgetTypeConceptId!: string;

  @Property({ columnType: 'varchar' })
  title!: string;

  @Property({
    fieldName: 'visualization_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  visualizationConceptId?: string;

  @Property({
    fieldName: 'config_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  configJson?: unknown;

  @Property({
    fieldName: 'position_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  positionJson?: unknown;

  @Property({ columnType: 'int', nullable: true })
  ordinal?: number;

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
