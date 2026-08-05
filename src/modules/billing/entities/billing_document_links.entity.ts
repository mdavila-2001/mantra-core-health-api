import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `billing_document_links`.
 */
@Entity({ schema: 'billing', tableName: 'billing_document_links' })
export class BillingDocumentLinks {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /**
   * Identificador asociado a invoice.
   */
  @Property({ fieldName: 'invoice_id', type: 'uuid', nullable: true }) // FK → billing.invoices
  invoiceId?: string;

  /**
   * Identificador asociado a bill.
   */
  @Property({ fieldName: 'bill_id', type: 'uuid', nullable: true }) // FK → billing.bills
  billId?: string;

  /**
   * Identificador asociado a contract.
   */
  @Property({ fieldName: 'contract_id', type: 'uuid', nullable: true }) // FK → erp.contracts
  contractId?: string;

  /**
   * Identificador asociado a sales order.
   */
  @Property({ fieldName: 'sales_order_id', type: 'uuid', nullable: true }) // FK → erp.sales_orders
  salesOrderId?: string;

  /**
   * Identificador asociado a purchase order.
   */
  @Property({ fieldName: 'purchase_order_id', type: 'uuid', nullable: true }) // FK → erp.purchase_orders
  purchaseOrderId?: string;

  /**
   * Identificador asociado a claim.
   */
  @Property({ fieldName: 'claim_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  claimId?: string;

  /**
   * Identificador asociado a encounter.
   */
  @Property({ fieldName: 'encounter_id', type: 'uuid', nullable: true }) // FK → clinical.encounters
  encounterId?: string;

  /**
   * Identificador asociado a relation type concept.
   */
  @Property({ fieldName: 'relation_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  relationTypeConceptId!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
