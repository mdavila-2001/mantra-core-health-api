import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'billing', tableName: 'invoices' })
export class Invoices {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'practice_id', type: 'uuid' }) // FK → practice.practices
  practiceId!: string;

  @Property({ fieldName: 'invoice_number', columnType: 'varchar' })
  invoiceNumber!: string;

  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  @Property({ fieldName: 'encounter_id', type: 'uuid', nullable: true }) // FK → clinical.encounters
  encounterId?: string;

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

  @Property({
    fieldName: 'discount_total',
    columnType: 'numeric',
    nullable: true,
  })
  discountTotal?: string;

  @Property({ columnType: 'numeric', nullable: true })
  total?: string;

  @Property({ fieldName: 'paid_total', columnType: 'numeric', nullable: true })
  paidTotal?: string;

  @Property({ columnType: 'numeric', nullable: true })
  balance?: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  @Property({
    fieldName: 'customer_business_partner_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.business_partners
  customerBusinessPartnerId?: string;

  @Property({
    fieldName: 'customer_subledger_account_id',
    type: 'uuid',
    nullable: true,
  }) // FK → accounting.subledger_accounts
  customerSubledgerAccountId?: string;

  @Property({ fieldName: 'contract_id', type: 'uuid', nullable: true }) // FK → erp.contracts (inferida)
  contractId?: string;

  @Property({ fieldName: 'sales_order_id', type: 'uuid', nullable: true }) // FK → erp.sales_orders
  salesOrderId?: string;

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
