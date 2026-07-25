import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'accounting', tableName: 'open_items' })
export class OpenItems {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'subledger_account_id', type: 'uuid' }) // FK → accounting.subledger_accounts
  subledgerAccountId!: string;

  @Property({ fieldName: 'ledger_entry_id', type: 'uuid' }) // FK → accounting.ledger_entries
  ledgerEntryId!: string;

  @Property({ fieldName: 'document_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  documentTypeConceptId!: string;

  @Property({
    fieldName: 'document_number',
    columnType: 'varchar',
    nullable: true,
  })
  documentNumber?: string;

  @Property({ fieldName: 'invoice_id', type: 'uuid', nullable: true }) // FK → billing.invoices
  invoiceId?: string;

  @Property({ fieldName: 'bill_id', type: 'uuid', nullable: true }) // FK → billing.bills
  billId?: string;

  @Property({ fieldName: 'contract_id', type: 'uuid', nullable: true }) // FK → erp.contracts
  contractId?: string;

  @Property({ fieldName: 'baseline_date', columnType: 'date', nullable: true })
  baselineDate?: Date;

  @Property({ fieldName: 'due_date', columnType: 'date', nullable: true })
  dueDate?: Date;

  @Property({
    fieldName: 'original_amount',
    columnType: 'numeric',
    nullable: true,
  })
  originalAmount?: string;

  @Property({
    fieldName: 'outstanding_amount',
    columnType: 'numeric',
    nullable: true,
  })
  outstandingAmount?: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

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
