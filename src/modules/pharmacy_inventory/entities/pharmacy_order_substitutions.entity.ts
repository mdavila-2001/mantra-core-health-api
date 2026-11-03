import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `pharmacy_order_substitutions`.
 */
@Entity({
  schema: 'pharmacy_inventory',
  tableName: 'pharmacy_order_substitutions',
})
export class PharmacyOrderSubstitutions {
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
   * Identificador asociado a inventory reservation line.
   */
  @Property({ fieldName: 'inventory_reservation_line_id', type: 'uuid' }) // FK → pharmacy_inventory.inventory_reservation_lines
  inventoryReservationLineId!: string;

  /**
   * Identificador asociado a original pharmacy product.
   */
  @Property({ fieldName: 'original_pharmacy_product_id', type: 'uuid' }) // FK → pharmacy.pharmacy_products
  originalPharmacyProductId!: string;

  /**
   * Identificador asociado a proposed pharmacy product.
   */
  @Property({ fieldName: 'proposed_pharmacy_product_id', type: 'uuid' }) // FK → pharmacy.pharmacy_products
  proposedPharmacyProductId!: string;

  /**
   * Valor de original unit price amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'original_unit_price_amount',
    columnType: 'numeric',
    nullable: true,
  })
  originalUnitPriceAmount?: string;

  /**
   * Valor de proposed unit price amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'proposed_unit_price_amount',
    columnType: 'numeric',
    nullable: true,
  })
  proposedUnitPriceAmount?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de decided at mantenido por la instancia.
   */
  @Property({
    fieldName: 'decided_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  decidedAt?: Date;

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
