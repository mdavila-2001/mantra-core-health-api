import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'billing', tableName: 'bill_lines' })
export class BillLines {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'bill_id', type: 'uuid' }) // FK → billing.bills
  billId!: string;

  @Property({ columnType: 'varchar', nullable: true })
  description?: string;

  @Property({ columnType: 'numeric' })
  quantity!: string;

  @Property({ fieldName: 'unit_price', columnType: 'numeric' })
  unitPrice!: string;

  @Property({ fieldName: 'tax_amount', columnType: 'numeric', nullable: true })
  taxAmount?: string;

  @Property({ fieldName: 'line_total', columnType: 'numeric', nullable: true })
  lineTotal?: string;

  @Property({ fieldName: 'expense_account_id', type: 'uuid', nullable: true }) // FK → accounting.accounts
  expenseAccountId?: string;

  @Property({ fieldName: 'cost_center_id', type: 'uuid', nullable: true }) // FK → accounting.cost_centers
  costCenterId?: string;

  @Property({
    fieldName: 'contract_line_item_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.contract_line_items
  contractLineItemId?: string;

  @Property({
    fieldName: 'purchase_order_item_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.purchase_order_items
  purchaseOrderItemId?: string;

  @Property({
    fieldName: 'goods_receipt_item_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.goods_receipt_items
  goodsReceiptItemId?: string;

  @Property({
    fieldName: 'service_entry_item_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.service_entry_items
  serviceEntryItemId?: string;

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
