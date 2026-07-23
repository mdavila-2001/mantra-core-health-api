import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'practice', tableName: 'inventory_movements' })
export class InventoryMovements {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'inventory_item_id', type: 'uuid' }) // FK → practice.inventory_items
  inventoryItemId!: string;

  @Property({ fieldName: 'movement_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  movementTypeConceptId!: string;

  @Property({ columnType: 'numeric' })
  quantity!: string;

  @Property({
    fieldName: 'related_resource_type',
    columnType: 'varchar',
    nullable: true,
  })
  relatedResourceType?: string;

  @Property({ fieldName: 'related_resource_id', type: 'uuid', nullable: true })
  relatedResourceId?: string;

  @Property({
    fieldName: 'occurred_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  occurredAt?: Date;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
