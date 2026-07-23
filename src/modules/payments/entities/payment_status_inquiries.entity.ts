import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'payments', tableName: 'payment_status_inquiries' })
export class PaymentStatusInquiries {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'gateway_connection_id', type: 'uuid' }) // FK → payments.gateway_connections
  gatewayConnectionId!: string;

  @Property({ fieldName: 'payment_debt_id', type: 'uuid', nullable: true }) // FK → payments.payment_debts
  paymentDebtId?: string;

  @Property({
    fieldName: 'payment_checkout_session_id',
    type: 'uuid',
    nullable: true,
  }) // FK → payments.payment_checkout_sessions
  paymentCheckoutSessionId?: string;

  @Property({
    fieldName: 'payment_transaction_id',
    type: 'uuid',
    nullable: true,
  }) // FK → payments.payment_transactions
  paymentTransactionId?: string;

  @Property({
    fieldName: 'external_transaction_id',
    columnType: 'varchar',
    nullable: true,
  })
  externalTransactionId?: string;

  @Property({ fieldName: 'inquiry_reason_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  inquiryReasonConceptId!: string;

  @Property({ fieldName: 'requested_at', columnType: 'timestamptz' })
  requestedAt!: Date;

  @Property({
    fieldName: 'responded_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  respondedAt?: Date;

  @Property({ fieldName: 'result_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  resultStatusConceptId!: string;

  @Property({
    fieldName: 'provider_status_code',
    columnType: 'varchar',
    nullable: true,
  })
  providerStatusCode?: string;

  @Property({
    fieldName: 'provider_amount',
    columnType: 'numeric(20,6)',
    nullable: true,
  })
  providerAmount?: string;

  @Property({
    fieldName: 'provider_currency_code',
    columnType: 'char(3)',
    nullable: true,
  })
  providerCurrencyCode?: string;

  @Property({
    fieldName: 'response_hash',
    columnType: 'varchar',
    nullable: true,
  })
  responseHash?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
