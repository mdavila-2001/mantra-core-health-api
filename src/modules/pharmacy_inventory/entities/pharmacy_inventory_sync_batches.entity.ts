import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'pharmacy_inventory',
  tableName: 'pharmacy_inventory_sync_batches',
})
export class PharmacyInventorySyncBatches {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'pharmacy_integration_connection_id', type: 'uuid' }) // FK → pharmacy.pharmacy_integration_connections
  pharmacyIntegrationConnectionId!: string;

  @Property({ fieldName: 'direction_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  directionConceptId!: string;

  @Property({ fieldName: 'source_batch_identifier', columnType: 'varchar' })
  sourceBatchIdentifier!: string;

  @Property({
    fieldName: 'sync_cursor_before',
    columnType: 'varchar',
    nullable: true,
  })
  syncCursorBefore?: string;

  @Property({
    fieldName: 'sync_cursor_after',
    columnType: 'varchar',
    nullable: true,
  })
  syncCursorAfter?: string;

  @Property({
    fieldName: 'received_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  receivedAt?: Date;

  @Property({
    fieldName: 'completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  completedAt?: Date;

  @Property({ fieldName: 'item_count', columnType: 'int', nullable: true })
  itemCount?: number;

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
