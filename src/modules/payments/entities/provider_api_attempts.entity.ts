import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'payments', tableName: 'provider_api_attempts' })
export class ProviderApiAttempts {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'provider_api_operation_id', type: 'uuid' }) // FK → payments.provider_api_operations
  providerApiOperationId!: string;

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

  @Property({ fieldName: 'correlation_id', type: 'uuid' })
  correlationId!: string;

  @Property({ fieldName: 'attempt_number', columnType: 'int' })
  attemptNumber!: number;

  @Property({ fieldName: 'requested_at', columnType: 'timestamptz' })
  requestedAt!: Date;

  @Property({
    fieldName: 'responded_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  respondedAt?: Date;

  @Property({ fieldName: 'http_status', columnType: 'int', nullable: true })
  httpStatus?: number;

  @Property({ fieldName: 'result_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  resultConceptId!: string;

  @Property({
    fieldName: 'external_error_code',
    columnType: 'varchar',
    nullable: true,
  })
  externalErrorCode?: string;

  @Property({
    fieldName: 'request_hash',
    columnType: 'varchar',
    nullable: true,
  })
  requestHash?: string;

  @Property({
    fieldName: 'response_hash',
    columnType: 'varchar',
    nullable: true,
  })
  responseHash?: string;

  @Property({
    fieldName: 'response_body_redacted_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  responseBodyRedactedJson?: unknown;

  @Property({
    fieldName: 'retry_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  retryAt?: Date;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
