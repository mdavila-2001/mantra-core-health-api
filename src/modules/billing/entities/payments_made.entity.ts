import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'billing', tableName: 'payments_made' })
export class PaymentsMade {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'practice_id', type: 'uuid' }) // FK → practice.practices
  practiceId!: string;

  @Property({ fieldName: 'bill_id', type: 'uuid', nullable: true }) // FK → billing.bills
  billId?: string;

  @Property({ fieldName: 'vendor_id', type: 'uuid', nullable: true }) // FK → billing.vendors
  vendorId?: string;

  @Property({ columnType: 'numeric' })
  amount!: string;

  @Property({ fieldName: 'method_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  methodConceptId!: string;

  @Property({ fieldName: 'paid_at', columnType: 'timestamptz', nullable: true })
  paidAt?: Date;

  @Property({
    fieldName: 'payment_transaction_id',
    type: 'uuid',
    nullable: true,
  }) // FK → payments.payment_transactions
  paymentTransactionId?: string;

  @Property({ fieldName: 'clearing_document_id', type: 'uuid', nullable: true }) // FK → accounting.clearing_documents
  clearingDocumentId?: string;

  @Property({
    fieldName: 'company_bank_account_id',
    type: 'uuid',
    nullable: true,
  }) // FK → accounting.company_bank_accounts
  companyBankAccountId?: string;

  @Property({ fieldName: 'transaction_id', type: 'uuid', nullable: true }) // FK → payments.payment_transactions
  transactionId?: string;

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
