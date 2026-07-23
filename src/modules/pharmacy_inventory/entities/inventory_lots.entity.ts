import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'pharmacy_inventory', tableName: 'inventory_lots' })
export class InventoryLots {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'pharmacy_product_id', type: 'uuid' }) // FK → pharmacy.pharmacy_products
  pharmacyProductId!: string;

  @Property({ fieldName: 'lot_number', columnType: 'varchar' })
  lotNumber!: string;

  @Property({
    fieldName: 'manufacturer_lot_number',
    columnType: 'varchar',
    nullable: true,
  })
  manufacturerLotNumber?: string;

  @Property({
    fieldName: 'manufactured_at',
    columnType: 'date',
    nullable: true,
  })
  manufacturedAt?: Date;

  @Property({ fieldName: 'expires_at', columnType: 'date', nullable: true })
  expiresAt?: Date;

  @Property({
    fieldName: 'received_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  receivedAt?: Date;

  @Property({
    fieldName: 'quarantine_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  quarantineStatusConceptId?: string;

  @Property({
    fieldName: 'recall_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  recallStatusConceptId?: string;

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
