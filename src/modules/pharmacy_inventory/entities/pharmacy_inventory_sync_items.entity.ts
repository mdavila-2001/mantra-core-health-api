import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `pharmacy_inventory_sync_items`.
 */
@Entity({
  schema: 'pharmacy_inventory',
  tableName: 'pharmacy_inventory_sync_items',
})
export class PharmacyInventorySyncItems {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a pharmacy inventory sync batch.
   */
  @Property({ fieldName: 'pharmacy_inventory_sync_batch_id', type: 'uuid' }) // FK → pharmacy_inventory.pharmacy_inventory_sync_batches
  pharmacyInventorySyncBatchId!: string;

  /**
   * Identificador asociado a pharmacy product.
   */
  @Property({ fieldName: 'pharmacy_product_id', type: 'uuid', nullable: true }) // FK → pharmacy.pharmacy_products
  pharmacyProductId?: string;

  /**
   * Valor de external product code mantenido por la instancia.
   */
  @Property({
    fieldName: 'external_product_code',
    columnType: 'varchar',
    nullable: true,
  })
  externalProductCode?: string;

  /**
   * Valor de external location code mantenido por la instancia.
   */
  @Property({
    fieldName: 'external_location_code',
    columnType: 'varchar',
    nullable: true,
  })
  externalLocationCode?: string;

  /**
   * Valor de external lot number mantenido por la instancia.
   */
  @Property({
    fieldName: 'external_lot_number',
    columnType: 'varchar',
    nullable: true,
  })
  externalLotNumber?: string;

  /**
   * Valor de external quantity mantenido por la instancia.
   */
  @Property({
    fieldName: 'external_quantity',
    columnType: 'numeric',
    nullable: true,
  })
  externalQuantity?: string;

  /**
   * Valor de normalized quantity mantenido por la instancia.
   */
  @Property({
    fieldName: 'normalized_quantity',
    columnType: 'numeric',
    nullable: true,
  })
  normalizedQuantity?: string;

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
   * Identificador asociado a reconciliation status concept.
   */
  @Property({ fieldName: 'reconciliation_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  reconciliationStatusConceptId!: string;

  /**
   * Valor de error code mantenido por la instancia.
   */
  @Property({ fieldName: 'error_code', columnType: 'varchar', nullable: true })
  errorCode?: string;

  /**
   * Valor de error detail mantenido por la instancia.
   */
  @Property({ fieldName: 'error_detail', columnType: 'text', nullable: true })
  errorDetail?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
