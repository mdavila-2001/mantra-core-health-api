import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'pharmacy_inventory', tableName: 'inventory_ledger_entries' })
export class InventoryLedgerEntries {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'pharmacy_id', type: 'uuid' }) // FK → pharmacy.pharmacies
  pharmacyId!: string;

  @Property({ fieldName: 'pharmacy_site_id', type: 'uuid' }) // FK → pharmacy.pharmacy_sites
  pharmacySiteId!: string;

  @Property({ fieldName: 'inventory_location_id', type: 'uuid' }) // FK → pharmacy_inventory.inventory_locations
  inventoryLocationId!: string;

  @Property({ fieldName: 'pharmacy_product_id', type: 'uuid' }) // FK → pharmacy.pharmacy_products
  pharmacyProductId!: string;

  @Property({ fieldName: 'inventory_lot_id', type: 'uuid', nullable: true }) // FK → pharmacy_inventory.inventory_lots
  inventoryLotId?: string;

  @Property({ fieldName: 'inventory_serial_id', type: 'uuid', nullable: true }) // FK → pharmacy_inventory.inventory_serials
  inventorySerialId?: string;

  @Property({ fieldName: 'ledger_sequence', type: 'bigint' })
  ledgerSequence!: string;

  @Property({ fieldName: 'movement_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  movementTypeConceptId!: string;

  @Property({ fieldName: 'quantity_delta', columnType: 'numeric' })
  quantityDelta!: string;

  @Property({
    fieldName: 'reservation_delta',
    columnType: 'numeric',
    nullable: true,
  })
  reservationDelta?: string;

  @Property({
    fieldName: 'quarantine_delta',
    columnType: 'numeric',
    nullable: true,
  })
  quarantineDelta?: string;

  @Property({
    fieldName: 'unit_cost_amount',
    columnType: 'numeric',
    nullable: true,
  })
  unitCostAmount?: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  @Property({
    fieldName: 'source_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  sourceTypeConceptId?: string;

  @Property({ fieldName: 'source_id', type: 'uuid', nullable: true })
  sourceId?: string;

  @Property({
    fieldName: 'idempotency_key',
    columnType: 'varchar',
    nullable: true,
  })
  idempotencyKey?: string;

  @Property({ fieldName: 'correlation_id', type: 'uuid', nullable: true })
  correlationId?: string;

  @Property({
    fieldName: 'erp_goods_receipt_item_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.goods_receipt_items
  erpGoodsReceiptItemId?: string;

  @Property({
    fieldName: 'accounting_ledger_entry_id',
    type: 'uuid',
    nullable: true,
  }) // FK → accounting.ledger_entries
  accountingLedgerEntryId?: string;

  @Property({ fieldName: 'occurred_at', columnType: 'timestamptz' })
  occurredAt!: Date;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
