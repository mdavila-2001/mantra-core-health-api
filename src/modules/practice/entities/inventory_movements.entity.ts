import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `inventory_movements`.
 */
@Entity({ schema: 'practice', tableName: 'inventory_movements' })
export class InventoryMovements {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a inventory item.
   */
  @Property({ fieldName: 'inventory_item_id', type: 'uuid' }) // FK → practice.inventory_items
  inventoryItemId!: string;

  /**
   * Identificador asociado a movement type concept.
   */
  @Property({ fieldName: 'movement_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  movementTypeConceptId!: string;

  /**
   * Valor de quantity mantenido por la instancia.
   */
  @Property({ columnType: 'numeric' })
  quantity!: string;

  /**
   * Valor de related resource type mantenido por la instancia.
   */
  @Property({
    fieldName: 'related_resource_type',
    columnType: 'varchar',
    nullable: true,
  })
  relatedResourceType?: string;

  /**
   * Identificador asociado a related resource.
   */
  @Property({ fieldName: 'related_resource_id', type: 'uuid', nullable: true })
  relatedResourceId?: string;

  /**
   * Valor de occurred at mantenido por la instancia.
   */
  @Property({
    fieldName: 'occurred_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  occurredAt?: Date;

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
