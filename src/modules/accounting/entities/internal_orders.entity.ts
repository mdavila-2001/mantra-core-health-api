import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'accounting', tableName: 'internal_orders' })
export class InternalOrders {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'controlling_area_id', type: 'uuid' }) // FK → accounting.controlling_areas
  controllingAreaId!: string;

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'order_number', columnType: 'varchar' })
  orderNumber!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'order_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  orderTypeConceptId!: string;

  @Property({
    fieldName: 'responsible_cost_center_id',
    type: 'uuid',
    nullable: true,
  }) // FK → accounting.cost_centers
  responsibleCostCenterId?: string;

  @Property({
    fieldName: 'responsible_profit_center_id',
    type: 'uuid',
    nullable: true,
  }) // FK → accounting.profit_centers
  responsibleProfitCenterId?: string;

  @Property({ fieldName: 'project_id', type: 'uuid', nullable: true }) // FK → erp.projects
  projectId?: string;

  @Property({ fieldName: 'wbs_element_id', type: 'uuid', nullable: true }) // FK → erp.wbs_elements
  wbsElementId?: string;

  @Property({ fieldName: 'start_date', columnType: 'date', nullable: true })
  startDate?: Date;

  @Property({ fieldName: 'end_date', columnType: 'date', nullable: true })
  endDate?: Date;

  @Property({
    fieldName: 'budget_amount',
    columnType: 'numeric',
    nullable: true,
  })
  budgetAmount?: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

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
