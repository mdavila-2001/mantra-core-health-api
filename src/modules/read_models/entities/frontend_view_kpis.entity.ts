import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'read_models', tableName: 'frontend_view_kpis' })
export class FrontendViewKpis {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'frontend_page_view_id', type: 'uuid' }) // FK → read_models.frontend_page_views
  frontendPageViewId!: string;

  @Property({ fieldName: 'kpi_code', columnType: 'varchar' })
  kpiCode!: string;

  @Property({ columnType: 'varchar' })
  label!: string;

  @Property({ fieldName: 'value_column', columnType: 'varchar' })
  valueColumn!: string;

  @Property({ fieldName: 'comparison_column', columnType: 'varchar' })
  comparisonColumn!: string;

  @Property({ fieldName: 'unit_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  unitConceptId?: string;

  @Property({ fieldName: 'format_mask', columnType: 'varchar', nullable: true })
  formatMask?: string;

  @Property({
    fieldName: 'threshold_rules_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  thresholdRulesJson?: unknown;

  @Property({
    fieldName: 'drilldown_route_template',
    columnType: 'varchar',
    nullable: true,
  })
  drilldownRouteTemplate?: string;

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
