import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'pharmacy_inventory', tableName: 'inventory_serials' })
export class InventorySerials {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'inventory_lot_id', type: 'uuid' }) // FK → pharmacy_inventory.inventory_lots
  inventoryLotId!: string;

  @Property({ fieldName: 'serial_number', columnType: 'varchar' })
  serialNumber!: string;

  @Property({
    fieldName: 'verification_identifier',
    columnType: 'varchar',
    nullable: true,
  })
  verificationIdentifier?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'current_inventory_location_id',
    type: 'uuid',
    nullable: true,
  }) // FK → pharmacy_inventory.inventory_locations
  currentInventoryLocationId?: string;

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
