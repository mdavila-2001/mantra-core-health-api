import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `goods_receipts`.
 */
@Entity({ schema: 'erp', tableName: 'goods_receipts' })
export class GoodsReceipts {
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
   * Valor de receipt number mantenido por la instancia.
   */
  @Property({ fieldName: 'receipt_number', columnType: 'varchar' })
  receiptNumber!: string;

  /**
   * Identificador asociado a purchase order.
   */
  @Property({ fieldName: 'purchase_order_id', type: 'uuid' }) // FK → erp.purchase_orders
  purchaseOrderId!: string;

  /**
   * Identificador asociado a receiving branch.
   */
  @Property({ fieldName: 'receiving_branch_id', type: 'uuid', nullable: true }) // FK → directory.branches
  receivingBranchId?: string;

  /**
   * Identificador asociado a received by employee.
   */
  @Property({
    fieldName: 'received_by_employee_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.employees
  receivedByEmployeeId?: string;

  /**
   * Valor de received at mantenido por la instancia.
   */
  @Property({
    fieldName: 'received_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  receivedAt?: Date;

  /**
   * Valor de supplier delivery reference mantenido por la instancia.
   */
  @Property({
    fieldName: 'supplier_delivery_reference',
    columnType: 'varchar',
    nullable: true,
  })
  supplierDeliveryReference?: string;

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
