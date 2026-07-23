import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'practice', tableName: 'inventory_items' })
export class InventoryItems {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'practice_id', type: 'uuid' }) // FK → practice.practices
  practiceId!: string;

  @Property({ fieldName: 'product_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  productConceptId?: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'lot_number', columnType: 'varchar', nullable: true })
  lotNumber?: string;

  @Property({ fieldName: 'expiry_date', columnType: 'date', nullable: true })
  expiryDate?: Date;

  @Property({ fieldName: 'quantity_on_hand', columnType: 'numeric' })
  quantityOnHand!: string;

  @Property({ fieldName: 'unit_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  unitConceptId?: string;

  @Property({
    fieldName: 'reorder_level',
    columnType: 'numeric',
    nullable: true,
  })
  reorderLevel?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
