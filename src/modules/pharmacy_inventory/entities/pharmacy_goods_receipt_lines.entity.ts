import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'pharmacy_inventory',
  tableName: 'pharmacy_goods_receipt_lines',
})
export class PharmacyGoodsReceiptLines {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'pharmacy_goods_receipt_id', type: 'uuid' }) // FK → pharmacy_inventory.pharmacy_goods_receipts
  pharmacyGoodsReceiptId!: string;

  @Property({ fieldName: 'pharmacy_purchase_order_line_id', type: 'uuid' }) // FK → pharmacy_inventory.pharmacy_purchase_order_lines
  pharmacyPurchaseOrderLineId!: string;

  @Property({
    fieldName: 'erp_goods_receipt_item_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.goods_receipt_items
  erpGoodsReceiptItemId?: string;

  @Property({ fieldName: 'pharmacy_product_id', type: 'uuid' }) // FK → pharmacy.pharmacy_products
  pharmacyProductId!: string;

  @Property({ fieldName: 'inventory_lot_id', type: 'uuid', nullable: true }) // FK → pharmacy_inventory.inventory_lots
  inventoryLotId?: string;

  @Property({
    fieldName: 'inventory_location_id',
    type: 'uuid',
    nullable: true,
  }) // FK → pharmacy_inventory.inventory_locations
  inventoryLocationId?: string;

  @Property({ fieldName: 'received_quantity', columnType: 'numeric' })
  receivedQuantity!: string;

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
    fieldName: 'unit_cost_amount',
    columnType: 'numeric',
    nullable: true,
  })
  unitCostAmount?: string;

  @Property({ fieldName: 'ledger_entry_id', type: 'uuid', nullable: true }) // FK → accounting.ledger_entries
  ledgerEntryId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
