import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'billing', tableName: 'bills' })
export class Bills {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'practice_id', type: 'uuid' }) // FK → practice.practices
  practiceId!: string;

  @Property({ fieldName: 'vendor_id', type: 'uuid' }) // FK → billing.vendors
  vendorId!: string;

  @Property({ fieldName: 'bill_number', columnType: 'varchar' })
  billNumber!: string;

  @Property({ fieldName: 'issue_date', columnType: 'date' })
  issueDate!: Date;

  @Property({ fieldName: 'due_date', columnType: 'date', nullable: true })
  dueDate?: Date;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ columnType: 'numeric', nullable: true })
  subtotal?: string;

  @Property({ fieldName: 'tax_total', columnType: 'numeric', nullable: true })
  taxTotal?: string;

  @Property({ columnType: 'numeric', nullable: true })
  total?: string;

  @Property({ fieldName: 'paid_total', columnType: 'numeric', nullable: true })
  paidTotal?: string;

  @Property({ columnType: 'numeric', nullable: true })
  balance?: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  @Property({
    fieldName: 'supplier_business_partner_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.business_partners
  supplierBusinessPartnerId?: string;

  @Property({
    fieldName: 'supplier_subledger_account_id',
    type: 'uuid',
    nullable: true,
  }) // FK → accounting.subledger_accounts
  supplierSubledgerAccountId?: string;

  @Property({ fieldName: 'contract_id', type: 'uuid', nullable: true }) // FK → erp.contracts (inferida)
  contractId?: string;

  @Property({ fieldName: 'purchase_order_id', type: 'uuid', nullable: true }) // FK → erp.purchase_orders
  purchaseOrderId?: string;

  @Property({ fieldName: 'transaction_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  transactionId?: string;

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
