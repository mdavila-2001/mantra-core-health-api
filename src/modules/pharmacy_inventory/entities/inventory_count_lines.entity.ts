import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'pharmacy_inventory', tableName: 'inventory_count_lines' })
export class InventoryCountLines {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'inventory_count_session_id', type: 'uuid' }) // FK → pharmacy_inventory.inventory_count_sessions
  inventoryCountSessionId!: string;

  @Property({ fieldName: 'pharmacy_product_id', type: 'uuid' }) // FK → pharmacy.pharmacy_products
  pharmacyProductId!: string;

  @Property({ fieldName: 'inventory_lot_id', type: 'uuid', nullable: true }) // FK → pharmacy_inventory.inventory_lots
  inventoryLotId?: string;

  @Property({ fieldName: 'expected_quantity', columnType: 'numeric' })
  expectedQuantity!: string;

  @Property({ fieldName: 'counted_quantity', columnType: 'numeric' })
  countedQuantity!: string;

  @Property({ fieldName: 'variance_quantity', columnType: 'numeric' })
  varianceQuantity!: string;

  @Property({
    fieldName: 'variance_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  varianceReasonConceptId?: string;

  @Property({
    fieldName: 'adjustment_ledger_entry_id',
    type: 'uuid',
    nullable: true,
  }) // FK → accounting.ledger_entries
  adjustmentLedgerEntryId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
