import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'erp', tableName: 'goods_receipt_items' })
export class GoodsReceiptItems {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'goods_receipt_id', type: 'uuid' }) // FK → erp.goods_receipts
  goodsReceiptId!: string;

  @Property({ fieldName: 'purchase_order_item_id', type: 'uuid' }) // FK → erp.purchase_order_items
  purchaseOrderItemId!: string;

  @Property({ fieldName: 'line_number', columnType: 'int' })
  lineNumber!: number;

  @Property({
    fieldName: 'received_quantity',
    columnType: 'numeric',
    nullable: true,
  })
  receivedQuantity?: string;

  @Property({
    fieldName: 'accepted_quantity',
    columnType: 'numeric',
    nullable: true,
  })
  acceptedQuantity?: string;

  @Property({
    fieldName: 'rejected_quantity',
    columnType: 'numeric',
    nullable: true,
  })
  rejectedQuantity?: string;

  @Property({
    fieldName: 'inventory_ledger_entry_id',
    type: 'uuid',
    nullable: true,
  }) // FK → pharmacy_inventory.inventory_ledger_entries
  inventoryLedgerEntryId?: string;

  @Property({ fieldName: 'asset_id', type: 'uuid', nullable: true }) // FK → accounting.assets
  assetId?: string;

  @Property({
    fieldName: 'quality_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  qualityStatusConceptId?: string;

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
