import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `sales_orders`.
 */
@Entity({ schema: 'erp', tableName: 'sales_orders' })
export class SalesOrders {
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
   * Valor de sales order number mantenido por la instancia.
   */
  @Property({ fieldName: 'sales_order_number', columnType: 'varchar' })
  salesOrderNumber!: string;

  /**
   * Identificador asociado a customer business partner.
   */
  @Property({ fieldName: 'customer_business_partner_id', type: 'uuid' }) // FK → erp.business_partners
  customerBusinessPartnerId!: string;

  /**
   * Identificador asociado a contract.
   */
  @Property({ fieldName: 'contract_id', type: 'uuid', nullable: true }) // FK → erp.contracts
  contractId?: string;

  /**
   * Identificador asociado a opportunity.
   */
  @Property({ fieldName: 'opportunity_id', type: 'uuid', nullable: true }) // FK → crm.opportunities
  opportunityId?: string;

  /**
   * Valor de order date mantenido por la instancia.
   */
  @Property({ fieldName: 'order_date', columnType: 'date', nullable: true })
  orderDate?: Date;

  /**
   * Valor de requested service date mantenido por la instancia.
   */
  @Property({
    fieldName: 'requested_service_date',
    columnType: 'date',
    nullable: true,
  })
  requestedServiceDate?: Date;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  /**
   * Identificador asociado a payment terms concept.
   */
  @Property({
    fieldName: 'payment_terms_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  paymentTermsConceptId?: string;

  /**
   * Identificador asociado a owner employee.
   */
  @Property({ fieldName: 'owner_employee_id', type: 'uuid', nullable: true }) // FK → erp.employees
  ownerEmployeeId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
