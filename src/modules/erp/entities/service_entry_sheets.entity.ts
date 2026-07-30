import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `service_entry_sheets`.
 */
@Entity({ schema: 'erp', tableName: 'service_entry_sheets' })
export class ServiceEntrySheets {
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
   * Valor de sheet number mantenido por la instancia.
   */
  @Property({ fieldName: 'sheet_number', columnType: 'varchar' })
  sheetNumber!: string;

  /**
   * Identificador asociado a purchase order.
   */
  @Property({ fieldName: 'purchase_order_id', type: 'uuid' }) // FK → erp.purchase_orders
  purchaseOrderId!: string;

  /**
   * Identificador asociado a supplier business partner.
   */
  @Property({
    fieldName: 'supplier_business_partner_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.business_partners
  supplierBusinessPartnerId?: string;

  /**
   * Valor de performed from mantenido por la instancia.
   */
  @Property({ fieldName: 'performed_from', columnType: 'date', nullable: true })
  performedFrom?: Date;

  /**
   * Valor de performed to mantenido por la instancia.
   */
  @Property({ fieldName: 'performed_to', columnType: 'date', nullable: true })
  performedTo?: Date;

  /**
   * Identificador asociado a accepted by employee.
   */
  @Property({
    fieldName: 'accepted_by_employee_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.employees
  acceptedByEmployeeId?: string;

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
