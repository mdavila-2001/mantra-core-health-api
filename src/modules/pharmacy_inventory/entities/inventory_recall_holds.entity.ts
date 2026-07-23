import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'pharmacy_inventory', tableName: 'inventory_recall_holds' })
export class InventoryRecallHolds {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'pharmacy_product_id', type: 'uuid' }) // FK → pharmacy.pharmacy_products
  pharmacyProductId!: string;

  @Property({ fieldName: 'inventory_lot_id', type: 'uuid', nullable: true }) // FK → pharmacy_inventory.inventory_lots
  inventoryLotId?: string;

  @Property({ fieldName: 'recall_reference', columnType: 'varchar' })
  recallReference!: string;

  @Property({ fieldName: 'recall_class_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  recallClassConceptId!: string;

  @Property({ fieldName: 'hold_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  holdStatusConceptId!: string;

  @Property({
    fieldName: 'initiated_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  initiatedAt?: Date;

  @Property({
    fieldName: 'released_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  releasedAt?: Date;

  @Property({
    fieldName: 'source_authority_tenant_id',
    type: 'uuid',
    nullable: true,
  }) // FK → directory.tenants
  sourceAuthorityTenantId?: string;

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
