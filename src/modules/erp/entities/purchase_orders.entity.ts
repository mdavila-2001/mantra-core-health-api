import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `purchase_orders`.
 */
@Entity({ schema: 'erp', tableName: 'purchase_orders' })
export class PurchaseOrders {
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
   * Valor de purchase order number mantenido por la instancia.
   */
  @Property({ fieldName: 'purchase_order_number', columnType: 'varchar' })
  purchaseOrderNumber!: string;

  /**
   * Identificador asociado a supplier business partner.
   */
  @Property({ fieldName: 'supplier_business_partner_id', type: 'uuid' }) // FK → erp.business_partners
  supplierBusinessPartnerId!: string;

  /**
   * Identificador asociado a contract.
   */
  @Property({ fieldName: 'contract_id', type: 'uuid', nullable: true }) // FK → erp.contracts
  contractId?: string;

  /**
   * Identificador asociado a purchase requisition.
   */
  @Property({
    fieldName: 'purchase_requisition_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.purchase_requisitions
  purchaseRequisitionId?: string;

  /**
   * Identificador asociado a ordering department.
   */
  @Property({
    fieldName: 'ordering_department_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.departments
  orderingDepartmentId?: string;

  /**
   * Identificador asociado a buyer employee.
   */
  @Property({ fieldName: 'buyer_employee_id', type: 'uuid', nullable: true }) // FK → erp.employees
  buyerEmployeeId?: string;

  /**
   * Valor de order date mantenido por la instancia.
   */
  @Property({ fieldName: 'order_date', columnType: 'date', nullable: true })
  orderDate?: Date;

  /**
   * Valor de expected delivery date mantenido por la instancia.
   */
  @Property({
    fieldName: 'expected_delivery_date',
    columnType: 'date',
    nullable: true,
  })
  expectedDeliveryDate?: Date;

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
   * Identificador asociado a incoterm concept.
   */
  @Property({ fieldName: 'incoterm_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  incotermConceptId?: string;

  /**
   * Identificador asociado a approval status concept.
   */
  @Property({
    fieldName: 'approval_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  approvalStatusConceptId?: string;

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
