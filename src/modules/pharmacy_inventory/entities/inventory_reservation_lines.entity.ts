import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'pharmacy_inventory',
  tableName: 'inventory_reservation_lines',
})
export class InventoryReservationLines {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'inventory_reservation_id', type: 'uuid' }) // FK → pharmacy_inventory.inventory_reservations
  inventoryReservationId!: string;

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

  @Property({ fieldName: 'requested_quantity', columnType: 'numeric' })
  requestedQuantity!: string;

  @Property({ fieldName: 'reserved_quantity', columnType: 'numeric' })
  reservedQuantity!: string;

  @Property({
    fieldName: 'fulfilled_quantity',
    columnType: 'numeric',
    nullable: true,
  })
  fulfilledQuantity?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
