import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `provider_api_attempts`.
 */
@Entity({ schema: 'payments', tableName: 'provider_api_attempts' })
export class ProviderApiAttempts {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a provider api operation.
   */
  @Property({ fieldName: 'provider_api_operation_id', type: 'uuid' }) // FK → payments.provider_api_operations
  providerApiOperationId!: string;

  /**
   * Identificador asociado a payment debt.
   */
  @Property({ fieldName: 'payment_debt_id', type: 'uuid', nullable: true }) // FK → payments.payment_debts
  paymentDebtId?: string;

  /**
   * Identificador asociado a payment checkout session.
   */
  @Property({
    fieldName: 'payment_checkout_session_id',
    type: 'uuid',
    nullable: true,
  }) // FK → payments.payment_checkout_sessions
  paymentCheckoutSessionId?: string;

  /**
   * Identificador asociado a payment transaction.
   */
  @Property({
    fieldName: 'payment_transaction_id',
    type: 'uuid',
    nullable: true,
  }) // FK → payments.payment_transactions
  paymentTransactionId?: string;

  /**
   * Identificador asociado a correlation.
   */
  @Property({ fieldName: 'correlation_id', type: 'uuid' })
  correlationId!: string;

  /**
   * Valor de attempt number mantenido por la instancia.
   */
  @Property({ fieldName: 'attempt_number', columnType: 'int' })
  attemptNumber!: number;

  /**
   * Valor de requested at mantenido por la instancia.
   */
  @Property({ fieldName: 'requested_at', columnType: 'timestamptz' })
  requestedAt!: Date;

  /**
   * Valor de responded at mantenido por la instancia.
   */
  @Property({
    fieldName: 'responded_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  respondedAt?: Date;

  /**
   * Valor de http status mantenido por la instancia.
   */
  @Property({ fieldName: 'http_status', columnType: 'int', nullable: true })
  httpStatus?: number;

  /**
   * Identificador asociado a result concept.
   */
  @Property({ fieldName: 'result_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  resultConceptId!: string;

  /**
   * Valor de external error code mantenido por la instancia.
   */
  @Property({
    fieldName: 'external_error_code',
    columnType: 'varchar',
    nullable: true,
  })
  externalErrorCode?: string;

  /**
   * Valor de request hash mantenido por la instancia.
   */
  @Property({
    fieldName: 'request_hash',
    columnType: 'varchar',
    nullable: true,
  })
  requestHash?: string;

  /**
   * Valor de response hash mantenido por la instancia.
   */
  @Property({
    fieldName: 'response_hash',
    columnType: 'varchar',
    nullable: true,
  })
  responseHash?: string;

  /**
   * Valor de response body redacted json mantenido por la instancia.
   */
  @Property({
    fieldName: 'response_body_redacted_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  responseBodyRedactedJson?: unknown;

  /**
   * Valor de retry at mantenido por la instancia.
   */
  @Property({
    fieldName: 'retry_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  retryAt?: Date;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
