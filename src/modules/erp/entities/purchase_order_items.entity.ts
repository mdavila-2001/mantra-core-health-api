import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'erp', tableName: 'purchase_order_items' })
export class PurchaseOrderItems {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'purchase_order_id', type: 'uuid' }) // FK → erp.purchase_orders
  purchaseOrderId!: string;

  @Property({ fieldName: 'line_number', columnType: 'int' })
  lineNumber!: number;

  @Property({
    fieldName: 'purchase_requisition_item_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.purchase_requisition_items
  purchaseRequisitionItemId?: string;

  @Property({
    fieldName: 'contract_line_item_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.contract_line_items
  contractLineItemId?: string;

  @Property({ fieldName: 'item_type_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  itemTypeConceptId?: string;

  @Property({ columnType: 'varchar', nullable: true })
  description?: string;

  @Property({
    fieldName: 'product_ref_type',
    columnType: 'varchar',
    nullable: true,
  })
  productRefType?: string;

  @Property({ fieldName: 'product_ref_id', type: 'uuid', nullable: true })
  productRefId?: string;

  @Property({ columnType: 'numeric', nullable: true })
  quantity?: string;

  @Property({ fieldName: 'unit_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  unitConceptId?: string;

  @Property({ fieldName: 'unit_price', columnType: 'numeric', nullable: true })
  unitPrice?: string;

  @Property({ fieldName: 'tax_code_id', type: 'uuid', nullable: true }) // FK → billing.tax_codes
  taxCodeId?: string;

  @Property({ fieldName: 'expense_account_id', type: 'uuid', nullable: true }) // FK → accounting.accounts
  expenseAccountId?: string;

  @Property({ fieldName: 'inventory_account_id', type: 'uuid', nullable: true }) // FK → accounting.accounts
  inventoryAccountId?: string;

  @Property({ fieldName: 'asset_id', type: 'uuid', nullable: true }) // FK → accounting.assets
  assetId?: string;

  @Property({ fieldName: 'cost_center_id', type: 'uuid', nullable: true }) // FK → accounting.cost_centers
  costCenterId?: string;

  @Property({ fieldName: 'profit_center_id', type: 'uuid', nullable: true }) // FK → accounting.profit_centers
  profitCenterId?: string;

  @Property({ fieldName: 'project_id', type: 'uuid', nullable: true }) // FK → erp.projects
  projectId?: string;

  @Property({ fieldName: 'wbs_element_id', type: 'uuid', nullable: true }) // FK → erp.wbs_elements
  wbsElementId?: string;

  @Property({ fieldName: 'branch_id', type: 'uuid', nullable: true }) // FK → directory.branches
  branchId?: string;

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
