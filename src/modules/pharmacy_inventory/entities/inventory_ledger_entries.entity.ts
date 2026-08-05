import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `inventory_ledger_entries`.
 */
@Entity({ schema: 'pharmacy_inventory', tableName: 'inventory_ledger_entries' })
export class InventoryLedgerEntries {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a pharmacy.
   */
  @Property({ fieldName: 'pharmacy_id', type: 'uuid' }) // FK → pharmacy.pharmacies
  pharmacyId!: string;

  /**
   * Identificador asociado a pharmacy site.
   */
  @Property({ fieldName: 'pharmacy_site_id', type: 'uuid' }) // FK → pharmacy.pharmacy_sites
  pharmacySiteId!: string;

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
   * Identificador asociado a inventory serial.
   */
  @Property({ fieldName: 'inventory_serial_id', type: 'uuid', nullable: true }) // FK → pharmacy_inventory.inventory_serials
  inventorySerialId?: string;

  /**
   * Valor de ledger sequence mantenido por la instancia.
   */
  @Property({ fieldName: 'ledger_sequence', type: 'bigint' })
  ledgerSequence!: string;

  /**
   * Identificador asociado a movement type concept.
   */
  @Property({ fieldName: 'movement_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  movementTypeConceptId!: string;

  /**
   * Valor de quantity delta mantenido por la instancia.
   */
  @Property({ fieldName: 'quantity_delta', columnType: 'numeric' })
  quantityDelta!: string;

  /**
   * Valor de reservation delta mantenido por la instancia.
   */
  @Property({
    fieldName: 'reservation_delta',
    columnType: 'numeric',
    nullable: true,
  })
  reservationDelta?: string;

  /**
   * Valor de quarantine delta mantenido por la instancia.
   */
  @Property({
    fieldName: 'quarantine_delta',
    columnType: 'numeric',
    nullable: true,
  })
  quarantineDelta?: string;

  /**
   * Valor de unit cost amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'unit_cost_amount',
    columnType: 'numeric',
    nullable: true,
  })
  unitCostAmount?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  /**
   * Identificador asociado a source type concept.
   */
  @Property({
    fieldName: 'source_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  sourceTypeConceptId?: string;

  /**
   * Identificador asociado a source.
   */
  @Property({ fieldName: 'source_id', type: 'uuid', nullable: true })
  sourceId?: string;

  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  @Property({
    fieldName: 'idempotency_key',
    columnType: 'varchar',
    nullable: true,
  })
  idempotencyKey?: string;

  /**
   * Identificador asociado a correlation.
   */
  @Property({ fieldName: 'correlation_id', type: 'uuid', nullable: true })
  correlationId?: string;

  /**
   * Identificador asociado a erp goods receipt item.
   */
  @Property({
    fieldName: 'erp_goods_receipt_item_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.goods_receipt_items
  erpGoodsReceiptItemId?: string;

  /**
   * Identificador asociado a accounting ledger entry.
   */
  @Property({
    fieldName: 'accounting_ledger_entry_id',
    type: 'uuid',
    nullable: true,
  }) // FK → accounting.ledger_entries
  accountingLedgerEntryId?: string;

  /**
   * Valor de occurred at mantenido por la instancia.
   */
  @Property({ fieldName: 'occurred_at', columnType: 'timestamptz' })
  occurredAt!: Date;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  /**
   * Identificador asociado a recorded by user.
   */
  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
