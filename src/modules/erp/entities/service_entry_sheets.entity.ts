import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'erp', tableName: 'service_entry_sheets' })
export class ServiceEntrySheets {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'sheet_number', columnType: 'varchar' })
  sheetNumber!: string;

  @Property({ fieldName: 'purchase_order_id', type: 'uuid' }) // FK → erp.purchase_orders
  purchaseOrderId!: string;

  @Property({
    fieldName: 'supplier_business_partner_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.business_partners
  supplierBusinessPartnerId?: string;

  @Property({ fieldName: 'performed_from', columnType: 'date', nullable: true })
  performedFrom?: Date;

  @Property({ fieldName: 'performed_to', columnType: 'date', nullable: true })
  performedTo?: Date;

  @Property({
    fieldName: 'accepted_by_employee_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.employees
  acceptedByEmployeeId?: string;

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
