import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `invoice_match_items`.
 */
@Entity({ schema: 'erp', tableName: 'invoice_match_items' })
export class InvoiceMatchItems {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a invoice match run.
   */
  @Property({ fieldName: 'invoice_match_run_id', type: 'uuid' }) // FK → erp.invoice_match_runs
  invoiceMatchRunId!: string;

  /**
   * Identificador asociado a bill line.
   */
  @Property({ fieldName: 'bill_line_id', type: 'uuid' }) // FK → billing.bill_lines
  billLineId!: string;

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
   * Valor de invoice quantity mantenido por la instancia.
   */
  @Property({
    fieldName: 'invoice_quantity',
    columnType: 'numeric',
    nullable: true,
  })
  invoiceQuantity?: string;

  /**
   * Valor de ordered quantity mantenido por la instancia.
   */
  @Property({
    fieldName: 'ordered_quantity',
    columnType: 'numeric',
    nullable: true,
  })
  orderedQuantity?: string;

  /**
   * Valor de received quantity mantenido por la instancia.
   */
  @Property({
    fieldName: 'received_quantity',
    columnType: 'numeric',
    nullable: true,
  })
  receivedQuantity?: string;

  /**
   * Valor de invoice amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'invoice_amount',
    columnType: 'numeric',
    nullable: true,
  })
  invoiceAmount?: string;

  /**
   * Valor de ordered amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'ordered_amount',
    columnType: 'numeric',
    nullable: true,
  })
  orderedAmount?: string;

  /**
   * Valor de variance quantity mantenido por la instancia.
   */
  @Property({
    fieldName: 'variance_quantity',
    columnType: 'numeric',
    nullable: true,
  })
  varianceQuantity?: string;

  /**
   * Valor de variance amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'variance_amount',
    columnType: 'numeric',
    nullable: true,
  })
  varianceAmount?: string;

  /**
   * Identificador asociado a tolerance rule concept.
   */
  @Property({
    fieldName: 'tolerance_rule_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  toleranceRuleConceptId?: string;

  /**
   * Identificador asociado a result concept.
   */
  @Property({ fieldName: 'result_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  resultConceptId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
