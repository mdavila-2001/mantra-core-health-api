import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'erp', tableName: 'goods_receipts' })
export class GoodsReceipts {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'receipt_number', columnType: 'varchar' })
  receiptNumber!: string;

  @Property({ fieldName: 'purchase_order_id', type: 'uuid' }) // FK → erp.purchase_orders
  purchaseOrderId!: string;

  @Property({ fieldName: 'receiving_branch_id', type: 'uuid', nullable: true }) // FK → directory.branches
  receivingBranchId?: string;

  @Property({
    fieldName: 'received_by_employee_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.employees
  receivedByEmployeeId?: string;

  @Property({
    fieldName: 'received_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  receivedAt?: Date;

  @Property({
    fieldName: 'supplier_delivery_reference',
    columnType: 'varchar',
    nullable: true,
  })
  supplierDeliveryReference?: string;

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
