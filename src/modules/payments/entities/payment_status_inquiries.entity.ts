import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `payment_status_inquiries`.
 */
@Entity({ schema: 'payments', tableName: 'payment_status_inquiries' })
export class PaymentStatusInquiries {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a gateway connection.
   */
  @Property({ fieldName: 'gateway_connection_id', type: 'uuid' }) // FK → payments.gateway_connections
  gatewayConnectionId!: string;

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
   * Identificador asociado a external transaction.
   */
  @Property({
    fieldName: 'external_transaction_id',
    columnType: 'varchar',
    nullable: true,
  })
  externalTransactionId?: string;

  /**
   * Identificador asociado a inquiry reason concept.
   */
  @Property({ fieldName: 'inquiry_reason_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  inquiryReasonConceptId!: string;

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
   * Identificador asociado a result status concept.
   */
  @Property({ fieldName: 'result_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  resultStatusConceptId!: string;

  /**
   * Valor de provider status code mantenido por la instancia.
   */
  @Property({
    fieldName: 'provider_status_code',
    columnType: 'varchar',
    nullable: true,
  })
  providerStatusCode?: string;

  /**
   * Valor de provider amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'provider_amount',
    columnType: 'numeric(20,6)',
    nullable: true,
  })
  providerAmount?: string;

  /**
   * Valor de provider currency code mantenido por la instancia.
   */
  @Property({
    fieldName: 'provider_currency_code',
    columnType: 'char(3)',
    nullable: true,
  })
  providerCurrencyCode?: string;

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
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
