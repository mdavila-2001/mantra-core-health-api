import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'pharmacy_inventory',
  tableName: 'pharmacy_order_substitutions',
})
export class PharmacyOrderSubstitutions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'inventory_reservation_id', type: 'uuid' }) // FK → pharmacy_inventory.inventory_reservations
  inventoryReservationId!: string;

  @Property({ fieldName: 'inventory_reservation_line_id', type: 'uuid' }) // FK → pharmacy_inventory.inventory_reservation_lines
  inventoryReservationLineId!: string;

  @Property({ fieldName: 'original_pharmacy_product_id', type: 'uuid' }) // FK → pharmacy.pharmacy_products
  originalPharmacyProductId!: string;

  @Property({ fieldName: 'proposed_pharmacy_product_id', type: 'uuid' }) // FK → pharmacy.pharmacy_products
  proposedPharmacyProductId!: string;

  @Property({
    fieldName: 'original_unit_price_amount',
    columnType: 'numeric',
    nullable: true,
  })
  originalUnitPriceAmount?: string;

  @Property({
    fieldName: 'proposed_unit_price_amount',
    columnType: 'numeric',
    nullable: true,
  })
  proposedUnitPriceAmount?: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'decided_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  decidedAt?: Date;

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
