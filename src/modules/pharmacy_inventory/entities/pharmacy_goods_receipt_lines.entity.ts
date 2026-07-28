import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `pharmacy_goods_receipt_lines`.
 */
@Entity({
  schema: 'pharmacy_inventory',
  tableName: 'pharmacy_goods_receipt_lines',
})
export class PharmacyGoodsReceiptLines {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a pharmacy goods receipt.
   */
  @Property({ fieldName: 'pharmacy_goods_receipt_id', type: 'uuid' }) // FK → pharmacy_inventory.pharmacy_goods_receipts
  pharmacyGoodsReceiptId!: string;

  /**
   * Identificador asociado a pharmacy purchase order line.
   */
  @Property({ fieldName: 'pharmacy_purchase_order_line_id', type: 'uuid' }) // FK → pharmacy_inventory.pharmacy_purchase_order_lines
  pharmacyPurchaseOrderLineId!: string;

  /**
   * Identificador asociado a erp goods receipt item.
   */
  @Property({
    fieldName: 'erp_goods_receipt_item_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.goods_receipt_items
  erpGoodsReceiptItemId?: string;

  /**
   * Identificador asociado a pharmacy product.
   */
  @Property({ fieldName: 'pharmacy_product_id', type: 'uuid' }) // FK → pharmacy.pharmacy_products
  pharmacyProductId!: string;

  /**
   * Identificador asociado a inventory lot.
   */
  @Property({ fieldName: 'inventory_lot_id', type: 'uuid', nullable: true }) // FK → pharmacy_inventory.inventory_lots
  inventoryLotId?: string;

  /**
   * Identificador asociado a inventory location.
   */
  @Property({
    fieldName: 'inventory_location_id',
    type: 'uuid',
    nullable: true,
  }) // FK → pharmacy_inventory.inventory_locations
  inventoryLocationId?: string;

  /**
   * Valor de received quantity mantenido por la instancia.
   */
  @Property({ fieldName: 'received_quantity', columnType: 'numeric' })
  receivedQuantity!: string;

  /**
   * Valor de accepted quantity mantenido por la instancia.
   */
  @Property({
    fieldName: 'accepted_quantity',
    columnType: 'numeric',
    nullable: true,
  })
  acceptedQuantity?: string;

  /**
   * Valor de rejected quantity mantenido por la instancia.
   */
  @Property({
    fieldName: 'rejected_quantity',
    columnType: 'numeric',
    nullable: true,
  })
  rejectedQuantity?: string;

  /**
   * Valor de unit cost amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'unit_cost_amount',
    columnType: 'numeric',
    nullable: true,
  })
  unitCostAmount?: string;

  /**
   * Identificador asociado a ledger entry.
   */
  @Property({ fieldName: 'ledger_entry_id', type: 'uuid', nullable: true }) // FK → accounting.ledger_entries
  ledgerEntryId?: string;

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
