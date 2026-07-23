import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'erp', tableName: 'purchase_orders' })
export class PurchaseOrders {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'purchase_order_number', columnType: 'varchar' })
  purchaseOrderNumber!: string;

  @Property({ fieldName: 'supplier_business_partner_id', type: 'uuid' }) // FK → erp.business_partners
  supplierBusinessPartnerId!: string;

  @Property({ fieldName: 'contract_id', type: 'uuid', nullable: true }) // FK → erp.contracts
  contractId?: string;

  @Property({
    fieldName: 'purchase_requisition_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.purchase_requisitions
  purchaseRequisitionId?: string;

  @Property({
    fieldName: 'ordering_department_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.departments
  orderingDepartmentId?: string;

  @Property({ fieldName: 'buyer_employee_id', type: 'uuid', nullable: true }) // FK → erp.employees
  buyerEmployeeId?: string;

  @Property({ fieldName: 'order_date', columnType: 'date', nullable: true })
  orderDate?: Date;

  @Property({
    fieldName: 'expected_delivery_date',
    columnType: 'date',
    nullable: true,
  })
  expectedDeliveryDate?: Date;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  @Property({
    fieldName: 'payment_terms_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  paymentTermsConceptId?: string;

  @Property({ fieldName: 'incoterm_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  incotermConceptId?: string;

  @Property({
    fieldName: 'approval_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  approvalStatusConceptId?: string;

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
