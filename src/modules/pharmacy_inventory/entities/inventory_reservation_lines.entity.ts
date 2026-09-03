import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `inventory_reservation_lines`.
 */
@Entity({
  schema: 'pharmacy_inventory',
  tableName: 'inventory_reservation_lines',
})
export class InventoryReservationLines {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a inventory reservation.
   */
  @Property({ fieldName: 'inventory_reservation_id', type: 'uuid' }) // FK → pharmacy_inventory.inventory_reservations
  inventoryReservationId!: string;

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
   * Valor de requested quantity mantenido por la instancia.
   */
  @Property({ fieldName: 'requested_quantity', columnType: 'numeric' })
  requestedQuantity!: string;

  /**
   * Valor de reserved quantity mantenido por la instancia.
   */
  @Property({ fieldName: 'reserved_quantity', columnType: 'numeric' })
  reservedQuantity!: string;

  /**
   * Valor de fulfilled quantity mantenido por la instancia.
   */
  @Property({
    fieldName: 'fulfilled_quantity',
    columnType: 'numeric',
    nullable: true,
  })
  fulfilledQuantity?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'unit_price_amount',
    columnType: 'numeric',
    nullable: true,
  })
  unitPriceAmount?: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

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
