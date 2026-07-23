import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'erp', tableName: 'sales_orders' })
export class SalesOrders {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'sales_order_number', columnType: 'varchar' })
  salesOrderNumber!: string;

  @Property({ fieldName: 'customer_business_partner_id', type: 'uuid' }) // FK → erp.business_partners
  customerBusinessPartnerId!: string;

  @Property({ fieldName: 'contract_id', type: 'uuid', nullable: true }) // FK → erp.contracts
  contractId?: string;

  @Property({ fieldName: 'opportunity_id', type: 'uuid', nullable: true }) // FK → crm.opportunities
  opportunityId?: string;

  @Property({ fieldName: 'order_date', columnType: 'date', nullable: true })
  orderDate?: Date;

  @Property({
    fieldName: 'requested_service_date',
    columnType: 'date',
    nullable: true,
  })
  requestedServiceDate?: Date;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  @Property({
    fieldName: 'payment_terms_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  paymentTermsConceptId?: string;

  @Property({ fieldName: 'owner_employee_id', type: 'uuid', nullable: true }) // FK → erp.employees
  ownerEmployeeId?: string;

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
