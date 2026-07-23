import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'pharmacy_inventory',
  tableName: 'medication_dispensation_lines',
})
export class MedicationDispensationLines {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'medication_dispensation_id', type: 'uuid' }) // FK → pharmacy_inventory.medication_dispensations
  medicationDispensationId!: string;

  @Property({ fieldName: 'pharmacy_product_id', type: 'uuid' }) // FK → pharmacy.pharmacy_products
  pharmacyProductId!: string;

  @Property({ fieldName: 'inventory_lot_id', type: 'uuid', nullable: true }) // FK → pharmacy_inventory.inventory_lots
  inventoryLotId?: string;

  @Property({ fieldName: 'inventory_serial_id', type: 'uuid', nullable: true }) // FK → pharmacy_inventory.inventory_serials
  inventorySerialId?: string;

  @Property({ fieldName: 'dispensed_quantity', columnType: 'numeric' })
  dispensedQuantity!: string;

  @Property({
    fieldName: 'unit_price_amount',
    columnType: 'numeric',
    nullable: true,
  })
  unitPriceAmount?: string;

  @Property({
    fieldName: 'patient_amount',
    columnType: 'numeric',
    nullable: true,
  })
  patientAmount?: string;

  @Property({
    fieldName: 'insurer_amount',
    columnType: 'numeric',
    nullable: true,
  })
  insurerAmount?: string;

  @Property({ fieldName: 'ledger_entry_id', type: 'uuid', nullable: true }) // FK → accounting.ledger_entries
  ledgerEntryId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
