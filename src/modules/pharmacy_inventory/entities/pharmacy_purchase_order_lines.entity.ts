import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'pharmacy_inventory',
  tableName: 'pharmacy_purchase_order_lines',
})
export class PharmacyPurchaseOrderLines {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'pharmacy_purchase_order_id', type: 'uuid' }) // FK → pharmacy_inventory.pharmacy_purchase_orders
  pharmacyPurchaseOrderId!: string;

  @Property({ fieldName: 'pharmacy_product_id', type: 'uuid' }) // FK → pharmacy.pharmacy_products
  pharmacyProductId!: string;

  @Property({
    fieldName: 'erp_purchase_order_item_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.purchase_order_items
  erpPurchaseOrderItemId?: string;

  @Property({ fieldName: 'ordered_quantity', columnType: 'numeric' })
  orderedQuantity!: string;

  @Property({
    fieldName: 'received_quantity',
    columnType: 'numeric',
    nullable: true,
  })
  receivedQuantity?: string;

  @Property({
    fieldName: 'unit_cost_amount',
    columnType: 'numeric',
    nullable: true,
  })
  unitCostAmount?: string;

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
