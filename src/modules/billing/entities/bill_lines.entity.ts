import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `bill_lines`.
 */
@Entity({ schema: 'billing', tableName: 'bill_lines' })
export class BillLines {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a bill.
   */
  @Property({ fieldName: 'bill_id', type: 'uuid' }) // FK → billing.bills
  billId!: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  description?: string;

  /**
   * Valor de quantity mantenido por la instancia.
   */
  @Property({ columnType: 'numeric' })
  quantity!: string;

  /**
   * Valor de unit price mantenido por la instancia.
   */
  @Property({ fieldName: 'unit_price', columnType: 'numeric' })
  unitPrice!: string;

  /**
   * Valor de tax amount mantenido por la instancia.
   */
  @Property({ fieldName: 'tax_amount', columnType: 'numeric', nullable: true })
  taxAmount?: string;

  /**
   * Valor de line total mantenido por la instancia.
   */
  @Property({ fieldName: 'line_total', columnType: 'numeric', nullable: true })
  lineTotal?: string;

  /**
   * Identificador asociado a expense account.
   */
  @Property({ fieldName: 'expense_account_id', type: 'uuid', nullable: true }) // FK → accounting.accounts
  expenseAccountId?: string;

  /**
   * Identificador asociado a cost center.
   */
  @Property({ fieldName: 'cost_center_id', type: 'uuid', nullable: true }) // FK → accounting.cost_centers
  costCenterId?: string;

  /**
   * Identificador asociado a contract line item.
   */
  @Property({
    fieldName: 'contract_line_item_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.contract_line_items
  contractLineItemId?: string;

  /**
   * Identificador asociado a purchase order item.
   */
  @Property({
    fieldName: 'purchase_order_item_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.purchase_order_items
  purchaseOrderItemId?: string;

  /**
   * Identificador asociado a goods receipt item.
   */
  @Property({
    fieldName: 'goods_receipt_item_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.goods_receipt_items
  goodsReceiptItemId?: string;

  /**
   * Identificador asociado a service entry item.
   */
  @Property({
    fieldName: 'service_entry_item_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.service_entry_items
  serviceEntryItemId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
