import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `payment_transactions`.
 */
@Entity({ schema: 'payments', tableName: 'payment_transactions' })
export class PaymentTransactions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a payment intent.
   */
  @Property({ fieldName: 'payment_intent_id', type: 'uuid' }) // FK → payments.payment_intents
  paymentIntentId!: string;

  /**
   * Identificador asociado a gateway.
   */
  @Property({ fieldName: 'gateway_id', type: 'uuid' }) // FK → payments.payment_gateways
  gatewayId!: string;

  /**
   * Identificador asociado a transaction type concept.
   */
  @Property({ fieldName: 'transaction_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  transactionTypeConceptId!: string;

  /**
   * Valor de gateway transaction ref mantenido por la instancia.
   */
  @Property({
    fieldName: 'gateway_transaction_ref',
    columnType: 'varchar',
    nullable: true,
  })
  gatewayTransactionRef?: string;

  /**
   * Valor de amount mantenido por la instancia.
   */
  @Property({ columnType: 'numeric' })
  amount!: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  currencyConceptId!: string;

  /**
   * Valor de fee amount mantenido por la instancia.
   */
  @Property({ fieldName: 'fee_amount', columnType: 'numeric', nullable: true })
  feeAmount?: string;

  /**
   * Valor de net amount mantenido por la instancia.
   */
  @Property({ fieldName: 'net_amount', columnType: 'numeric', nullable: true })
  netAmount?: string;

  /**
   * Identificador asociado a payer business partner.
   */
  @Property({
    fieldName: 'payer_business_partner_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.business_partners
  payerBusinessPartnerId?: string;

  /**
   * Identificador asociado a payee business partner.
   */
  @Property({
    fieldName: 'payee_business_partner_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.business_partners
  payeeBusinessPartnerId?: string;

  /**
   * Identificador asociado a contract.
   */
  @Property({ fieldName: 'contract_id', type: 'uuid', nullable: true }) // FK → erp.contracts
  contractId?: string;

  /**
   * Identificador asociado a company bank account.
   */
  @Property({
    fieldName: 'company_bank_account_id',
    type: 'uuid',
    nullable: true,
  }) // FK → accounting.company_bank_accounts
  companyBankAccountId?: string;

  /**
   * Identificador asociado a clearing document.
   */
  @Property({ fieldName: 'clearing_document_id', type: 'uuid', nullable: true }) // FK → accounting.clearing_documents
  clearingDocumentId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de authorization code mantenido por la instancia.
   */
  @Property({
    fieldName: 'authorization_code',
    columnType: 'varchar',
    nullable: true,
  })
  authorizationCode?: string;

  /**
   * Valor de processed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'processed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  processedAt?: Date;

  /**
   * Identificador asociado a failure reason concept.
   */
  @Property({
    fieldName: 'failure_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  failureReasonConceptId?: string;

  /**
   * Identificador asociado a journal transaction.
   */
  @Property({
    fieldName: 'journal_transaction_id',
    type: 'uuid',
    nullable: true,
  }) // FK → accounting.journal_transactions
  journalTransactionId?: string;

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
