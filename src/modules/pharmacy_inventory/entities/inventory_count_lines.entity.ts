import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `inventory_count_lines`.
 */
@Entity({ schema: 'pharmacy_inventory', tableName: 'inventory_count_lines' })
export class InventoryCountLines {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a inventory count session.
   */
  @Property({ fieldName: 'inventory_count_session_id', type: 'uuid' }) // FK → pharmacy_inventory.inventory_count_sessions
  inventoryCountSessionId!: string;

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
   * Valor de expected quantity mantenido por la instancia.
   */
  @Property({ fieldName: 'expected_quantity', columnType: 'numeric' })
  expectedQuantity!: string;

  /**
   * Valor de counted quantity mantenido por la instancia.
   */
  @Property({ fieldName: 'counted_quantity', columnType: 'numeric' })
  countedQuantity!: string;

  /**
   * Valor de variance quantity mantenido por la instancia.
   */
  @Property({ fieldName: 'variance_quantity', columnType: 'numeric' })
  varianceQuantity!: string;

  /**
   * Identificador asociado a variance reason concept.
   */
  @Property({
    fieldName: 'variance_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  varianceReasonConceptId?: string;

  /**
   * Identificador asociado a adjustment ledger entry.
   */
  @Property({
    fieldName: 'adjustment_ledger_entry_id',
    type: 'uuid',
    nullable: true,
  }) // FK → accounting.ledger_entries
  adjustmentLedgerEntryId?: string;

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
