import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'pharmacy_inventory', tableName: 'pharmacy_goods_receipts' })
export class PharmacyGoodsReceipts {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'pharmacy_purchase_order_id', type: 'uuid' }) // FK → pharmacy_inventory.pharmacy_purchase_orders
  pharmacyPurchaseOrderId!: string;

  @Property({ fieldName: 'pharmacy_site_id', type: 'uuid' }) // FK → pharmacy.pharmacy_sites
  pharmacySiteId!: string;

  @Property({ fieldName: 'erp_goods_receipt_id', type: 'uuid', nullable: true }) // FK → erp.goods_receipts
  erpGoodsReceiptId?: string;

  @Property({ fieldName: 'receipt_number', columnType: 'varchar' })
  receiptNumber!: string;

  @Property({ fieldName: 'received_at', columnType: 'timestamptz' })
  receivedAt!: Date;

  @Property({
    fieldName: 'supplier_delivery_reference',
    columnType: 'varchar',
    nullable: true,
  })
  supplierDeliveryReference?: string;

  @Property({
    fieldName: 'source_document_file_id',
    type: 'uuid',
    nullable: true,
  }) // FK → common.files
  sourceDocumentFileId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'idempotency_key',
    columnType: 'varchar',
    nullable: true,
  })
  idempotencyKey?: string;

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
