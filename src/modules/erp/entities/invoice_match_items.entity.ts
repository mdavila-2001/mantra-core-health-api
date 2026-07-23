import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'erp', tableName: 'invoice_match_items' })
export class InvoiceMatchItems {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'invoice_match_run_id', type: 'uuid' }) // FK → erp.invoice_match_runs
  invoiceMatchRunId!: string;

  @Property({ fieldName: 'bill_line_id', type: 'uuid' }) // FK → billing.bill_lines
  billLineId!: string;

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

  @Property({
    fieldName: 'invoice_quantity',
    columnType: 'numeric',
    nullable: true,
  })
  invoiceQuantity?: string;

  @Property({
    fieldName: 'ordered_quantity',
    columnType: 'numeric',
    nullable: true,
  })
  orderedQuantity?: string;

  @Property({
    fieldName: 'received_quantity',
    columnType: 'numeric',
    nullable: true,
  })
  receivedQuantity?: string;

  @Property({
    fieldName: 'invoice_amount',
    columnType: 'numeric',
    nullable: true,
  })
  invoiceAmount?: string;

  @Property({
    fieldName: 'ordered_amount',
    columnType: 'numeric',
    nullable: true,
  })
  orderedAmount?: string;

  @Property({
    fieldName: 'variance_quantity',
    columnType: 'numeric',
    nullable: true,
  })
  varianceQuantity?: string;

  @Property({
    fieldName: 'variance_amount',
    columnType: 'numeric',
    nullable: true,
  })
  varianceAmount?: string;

  @Property({
    fieldName: 'tolerance_rule_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  toleranceRuleConceptId?: string;

  @Property({ fieldName: 'result_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  resultConceptId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
