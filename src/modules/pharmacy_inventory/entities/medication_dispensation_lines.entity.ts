import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `medication_dispensation_lines`.
 */
@Entity({
  schema: 'pharmacy_inventory',
  tableName: 'medication_dispensation_lines',
})
export class MedicationDispensationLines {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a medication dispensation.
   */
  @Property({ fieldName: 'medication_dispensation_id', type: 'uuid' }) // FK → pharmacy_inventory.medication_dispensations
  medicationDispensationId!: string;

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
   * Identificador asociado a inventory serial.
   */
  @Property({ fieldName: 'inventory_serial_id', type: 'uuid', nullable: true }) // FK → pharmacy_inventory.inventory_serials
  inventorySerialId?: string;

  /**
   * Valor de dispensed quantity mantenido por la instancia.
   */
  @Property({ fieldName: 'dispensed_quantity', columnType: 'numeric' })
  dispensedQuantity!: string;

  /**
   * Valor de unit price amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'unit_price_amount',
    columnType: 'numeric',
    nullable: true,
  })
  unitPriceAmount?: string;

  /**
   * Valor de patient amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'patient_amount',
    columnType: 'numeric',
    nullable: true,
  })
  patientAmount?: string;

  /**
   * Valor de insurer amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'insurer_amount',
    columnType: 'numeric',
    nullable: true,
  })
  insurerAmount?: string;

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
