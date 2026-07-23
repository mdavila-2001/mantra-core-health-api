import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'erp', tableName: 'sales_order_items' })
export class SalesOrderItems {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'sales_order_id', type: 'uuid' }) // FK → erp.sales_orders
  salesOrderId!: string;

  @Property({ fieldName: 'line_number', columnType: 'int' })
  lineNumber!: number;

  @Property({
    fieldName: 'contract_line_item_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.contract_line_items
  contractLineItemId?: string;

  @Property({
    fieldName: 'service_ref_type',
    columnType: 'varchar',
    nullable: true,
  })
  serviceRefType?: string;

  @Property({ fieldName: 'service_ref_id', type: 'uuid', nullable: true })
  serviceRefId?: string;

  @Property({ columnType: 'varchar', nullable: true })
  description?: string;

  @Property({ columnType: 'numeric', nullable: true })
  quantity?: string;

  @Property({ fieldName: 'unit_price', columnType: 'numeric', nullable: true })
  unitPrice?: string;

  @Property({ fieldName: 'tax_code_id', type: 'uuid', nullable: true }) // FK → billing.tax_codes
  taxCodeId?: string;

  @Property({ fieldName: 'income_account_id', type: 'uuid', nullable: true }) // FK → accounting.accounts
  incomeAccountId?: string;

  @Property({ fieldName: 'cost_center_id', type: 'uuid', nullable: true }) // FK → accounting.cost_centers
  costCenterId?: string;

  @Property({ fieldName: 'profit_center_id', type: 'uuid', nullable: true }) // FK → accounting.profit_centers
  profitCenterId?: string;

  @Property({ fieldName: 'project_id', type: 'uuid', nullable: true }) // FK → erp.projects
  projectId?: string;

  @Property({ fieldName: 'wbs_element_id', type: 'uuid', nullable: true }) // FK → erp.wbs_elements
  wbsElementId?: string;

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
