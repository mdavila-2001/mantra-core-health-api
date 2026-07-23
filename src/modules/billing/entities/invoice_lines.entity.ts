import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'billing', tableName: 'invoice_lines' })
export class InvoiceLines {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'invoice_id', type: 'uuid' }) // FK → billing.invoices
  invoiceId!: string;

  @Property({ fieldName: 'service_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  serviceId?: string;

  @Property({ columnType: 'varchar', nullable: true })
  description?: string;

  @Property({ columnType: 'numeric' })
  quantity!: string;

  @Property({ fieldName: 'unit_price', columnType: 'numeric' })
  unitPrice!: string;

  @Property({ columnType: 'numeric', nullable: true })
  discount?: string;

  @Property({ fieldName: 'tax_code_id', type: 'uuid', nullable: true }) // FK → billing.tax_codes
  taxCodeId?: string;

  @Property({ fieldName: 'tax_amount', columnType: 'numeric', nullable: true })
  taxAmount?: string;

  @Property({ fieldName: 'line_total', columnType: 'numeric', nullable: true })
  lineTotal?: string;

  @Property({ fieldName: 'income_account_id', type: 'uuid', nullable: true }) // FK → accounting.accounts
  incomeAccountId?: string;

  @Property({ fieldName: 'cost_center_id', type: 'uuid', nullable: true }) // FK → accounting.cost_centers
  costCenterId?: string;

  @Property({
    fieldName: 'contract_line_item_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.contract_line_items
  contractLineItemId?: string;

  @Property({ fieldName: 'sales_order_item_id', type: 'uuid', nullable: true }) // FK → erp.sales_order_items
  salesOrderItemId?: string;

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
