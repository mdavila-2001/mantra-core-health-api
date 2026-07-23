import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'pharmacy_inventory', tableName: 'pharmacy_purchase_orders' })
export class PharmacyPurchaseOrders {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'pharmacy_id', type: 'uuid' }) // FK → pharmacy.pharmacies
  pharmacyId!: string;

  @Property({ fieldName: 'pharmacy_site_id', type: 'uuid' }) // FK → pharmacy.pharmacy_sites
  pharmacySiteId!: string;

  @Property({ fieldName: 'pharmacy_supplier_id', type: 'uuid' }) // FK → pharmacy_inventory.pharmacy_suppliers
  pharmacySupplierId!: string;

  @Property({ fieldName: 'purchase_order_number', columnType: 'varchar' })
  purchaseOrderNumber!: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'ordered_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  orderedAt?: Date;

  @Property({
    fieldName: 'expected_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  expectedAt?: Date;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  @Property({
    fieldName: 'idempotency_key',
    columnType: 'varchar',
    nullable: true,
  })
  idempotencyKey?: string;

  @Property({
    fieldName: 'erp_purchase_order_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.purchase_orders
  erpPurchaseOrderId?: string;

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
