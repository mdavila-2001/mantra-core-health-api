import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'billing', tableName: 'billing_document_links' })
export class BillingDocumentLinks {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'invoice_id', type: 'uuid', nullable: true }) // FK → billing.invoices
  invoiceId?: string;

  @Property({ fieldName: 'bill_id', type: 'uuid', nullable: true }) // FK → billing.bills
  billId?: string;

  @Property({ fieldName: 'contract_id', type: 'uuid', nullable: true }) // FK → erp.contracts (inferida)
  contractId?: string;

  @Property({ fieldName: 'sales_order_id', type: 'uuid', nullable: true }) // FK → erp.sales_orders
  salesOrderId?: string;

  @Property({ fieldName: 'purchase_order_id', type: 'uuid', nullable: true }) // FK → erp.purchase_orders
  purchaseOrderId?: string;

  @Property({ fieldName: 'claim_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  claimId?: string;

  @Property({ fieldName: 'encounter_id', type: 'uuid', nullable: true }) // FK → clinical.encounters
  encounterId?: string;

  @Property({ fieldName: 'relation_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  relationTypeConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
