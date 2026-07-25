import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'payments', tableName: 'payment_transactions' })
export class PaymentTransactions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'payment_intent_id', type: 'uuid' }) // FK → payments.payment_intents
  paymentIntentId!: string;

  @Property({ fieldName: 'gateway_id', type: 'uuid' }) // FK → payments.payment_gateways
  gatewayId!: string;

  @Property({ fieldName: 'transaction_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  transactionTypeConceptId!: string;

  @Property({
    fieldName: 'gateway_transaction_ref',
    columnType: 'varchar',
    nullable: true,
  })
  gatewayTransactionRef?: string;

  @Property({ columnType: 'numeric' })
  amount!: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  currencyConceptId!: string;

  @Property({ fieldName: 'fee_amount', columnType: 'numeric', nullable: true })
  feeAmount?: string;

  @Property({ fieldName: 'net_amount', columnType: 'numeric', nullable: true })
  netAmount?: string;

  @Property({
    fieldName: 'payer_business_partner_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.business_partners
  payerBusinessPartnerId?: string;

  @Property({
    fieldName: 'payee_business_partner_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.business_partners
  payeeBusinessPartnerId?: string;

  @Property({ fieldName: 'contract_id', type: 'uuid', nullable: true }) // FK → erp.contracts
  contractId?: string;

  @Property({
    fieldName: 'company_bank_account_id',
    type: 'uuid',
    nullable: true,
  }) // FK → accounting.company_bank_accounts
  companyBankAccountId?: string;

  @Property({ fieldName: 'clearing_document_id', type: 'uuid', nullable: true }) // FK → accounting.clearing_documents
  clearingDocumentId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'authorization_code',
    columnType: 'varchar',
    nullable: true,
  })
  authorizationCode?: string;

  @Property({
    fieldName: 'processed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  processedAt?: Date;

  @Property({
    fieldName: 'failure_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  failureReasonConceptId?: string;

  @Property({
    fieldName: 'journal_transaction_id',
    type: 'uuid',
    nullable: true,
  }) // FK → accounting.journal_transactions
  journalTransactionId?: string;

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
