import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `goods_receipt_items`.
 */
@Entity({ schema: 'erp', tableName: 'goods_receipt_items' })
export class GoodsReceiptItems {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a goods receipt.
   */
  @Property({ fieldName: 'goods_receipt_id', type: 'uuid' }) // FK → erp.goods_receipts
  goodsReceiptId!: string;

  /**
   * Identificador asociado a purchase order item.
   */
  @Property({ fieldName: 'purchase_order_item_id', type: 'uuid' }) // FK → erp.purchase_order_items
  purchaseOrderItemId!: string;

  /**
   * Valor de line number mantenido por la instancia.
   */
  @Property({ fieldName: 'line_number', columnType: 'int' })
  lineNumber!: number;

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
   * Identificador asociado a inventory ledger entry.
   */
  @Property({
    fieldName: 'inventory_ledger_entry_id',
    type: 'uuid',
    nullable: true,
  }) // FK → pharmacy_inventory.inventory_ledger_entries
  inventoryLedgerEntryId?: string;

  /**
   * Identificador asociado a asset.
   */
  @Property({ fieldName: 'asset_id', type: 'uuid', nullable: true }) // FK → accounting.assets
  assetId?: string;

  /**
   * Identificador asociado a quality status concept.
   */
  @Property({
    fieldName: 'quality_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  qualityStatusConceptId?: string;

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
