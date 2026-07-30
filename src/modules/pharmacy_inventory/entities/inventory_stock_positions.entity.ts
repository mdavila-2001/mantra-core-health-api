import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `inventory_stock_positions`.
 */
@Entity({
  schema: 'pharmacy_inventory',
  tableName: 'inventory_stock_positions',
})
export class InventoryStockPositions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a inventory location.
   */
  @Property({ fieldName: 'inventory_location_id', type: 'uuid' }) // FK → pharmacy_inventory.inventory_locations
  inventoryLocationId!: string;

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
   * Valor de on hand quantity mantenido por la instancia.
   */
  @Property({ fieldName: 'on_hand_quantity', columnType: 'numeric' })
  onHandQuantity!: string;

  /**
   * Valor de reserved quantity mantenido por la instancia.
   */
  @Property({ fieldName: 'reserved_quantity', columnType: 'numeric' })
  reservedQuantity!: string;

  /**
   * Valor de quarantine quantity mantenido por la instancia.
   */
  @Property({ fieldName: 'quarantine_quantity', columnType: 'numeric' })
  quarantineQuantity!: string;

  /**
   * Valor de available quantity mantenido por la instancia.
   */
  @Property({ fieldName: 'available_quantity', columnType: 'numeric' })
  availableQuantity!: string;

  /**
   * Valor de last ledger sequence mantenido por la instancia.
   */
  @Property({ fieldName: 'last_ledger_sequence', type: 'bigint' })
  lastLedgerSequence!: string;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
