import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Propuestas de sustitución de un pedido de farmacia, renglón por renglón
 * (Patch v4.2.1).
 *
 * «Te proponen genérico X (Bs 25) en lugar de marca Y (Bs 60)»: la farmacia lo
 * propone al confirmar el pedido y **la decisión es siempre del paciente** —
 * aceptar o preferir el original.
 *
 * Cuelga de la **línea** además del pedido: la sustitución es de un renglón
 * concreto, y un pedido puede tener varias propuestas vivas a la vez.
 *
 * Es una **bitácora, no un campo mutable**: aceptar y preferir-el-original dejan
 * la fila viva como historia, así que no hay único por línea — una línea cuya
 * propuesta se rechazó puede recibir otra.
 *
 * No confundir con `medication_dispensations.substitution_reason_concept_id`:
 * aquél es el motivo que el mostrador registra **al dispensar**, no la propuesta
 * previa que el paciente todavía puede rechazar.
 */
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
