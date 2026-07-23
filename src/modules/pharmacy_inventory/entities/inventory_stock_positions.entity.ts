import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'pharmacy_inventory',
  tableName: 'inventory_stock_positions',
})
export class InventoryStockPositions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'inventory_location_id', type: 'uuid' }) // FK → pharmacy_inventory.inventory_locations
  inventoryLocationId!: string;

  @Property({ fieldName: 'pharmacy_product_id', type: 'uuid' }) // FK → pharmacy.pharmacy_products
  pharmacyProductId!: string;

  @Property({ fieldName: 'inventory_lot_id', type: 'uuid', nullable: true }) // FK → pharmacy_inventory.inventory_lots
  inventoryLotId?: string;

  @Property({ fieldName: 'on_hand_quantity', columnType: 'numeric' })
  onHandQuantity!: string;

  @Property({ fieldName: 'reserved_quantity', columnType: 'numeric' })
  reservedQuantity!: string;

  @Property({ fieldName: 'quarantine_quantity', columnType: 'numeric' })
  quarantineQuantity!: string;

  @Property({ fieldName: 'available_quantity', columnType: 'numeric' })
  availableQuantity!: string;

  @Property({ fieldName: 'last_ledger_sequence', type: 'bigint' })
  lastLedgerSequence!: string;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
