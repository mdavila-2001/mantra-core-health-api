import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'pharmacy_inventory',
  tableName: 'pharmacy_inventory_sync_items',
})
export class PharmacyInventorySyncItems {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'pharmacy_inventory_sync_batch_id', type: 'uuid' }) // FK → pharmacy_inventory.pharmacy_inventory_sync_batches
  pharmacyInventorySyncBatchId!: string;

  @Property({ fieldName: 'pharmacy_product_id', type: 'uuid', nullable: true }) // FK → pharmacy.pharmacy_products
  pharmacyProductId?: string;

  @Property({
    fieldName: 'external_product_code',
    columnType: 'varchar',
    nullable: true,
  })
  externalProductCode?: string;

  @Property({
    fieldName: 'external_location_code',
    columnType: 'varchar',
    nullable: true,
  })
  externalLocationCode?: string;

  @Property({
    fieldName: 'external_lot_number',
    columnType: 'varchar',
    nullable: true,
  })
  externalLotNumber?: string;

  @Property({
    fieldName: 'external_quantity',
    columnType: 'numeric',
    nullable: true,
  })
  externalQuantity?: string;

  @Property({
    fieldName: 'normalized_quantity',
    columnType: 'numeric',
    nullable: true,
  })
  normalizedQuantity?: string;

  @Property({
    fieldName: 'idempotency_key',
    columnType: 'varchar',
    nullable: true,
  })
  idempotencyKey?: string;

  @Property({ fieldName: 'reconciliation_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  reconciliationStatusConceptId!: string;

  @Property({ fieldName: 'error_code', columnType: 'varchar', nullable: true })
  errorCode?: string;

  @Property({ fieldName: 'error_detail', columnType: 'text', nullable: true })
  errorDetail?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
