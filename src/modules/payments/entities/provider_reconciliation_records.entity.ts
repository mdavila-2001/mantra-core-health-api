import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `provider_reconciliation_records`.
 */
@Entity({ schema: 'payments', tableName: 'provider_reconciliation_records' })
export class ProviderReconciliationRecords {
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
   * Identificador asociado a reconciliation run.
   */
  @Property({ fieldName: 'reconciliation_run_id', type: 'uuid' }) // FK → payments.reconciliation_runs
  reconciliationRunId!: string;

  /**
   * Identificador asociado a payment debt.
   */
  @Property({ fieldName: 'payment_debt_id', type: 'uuid', nullable: true }) // FK → payments.payment_debts
  paymentDebtId?: string;

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
  @Property({ fieldName: 'external_transaction_id', columnType: 'varchar' })
  externalTransactionId!: string;

  /**
   * Valor de provider status code mantenido por la instancia.
   */
  @Property({ fieldName: 'provider_status_code', columnType: 'varchar' })
  providerStatusCode!: string;

  /**
   * Valor de provider paid at mantenido por la instancia.
   */
  @Property({
    fieldName: 'provider_paid_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  providerPaidAt?: Date;

  /**
   * Valor de provider amount mantenido por la instancia.
   */
  @Property({ fieldName: 'provider_amount', columnType: 'numeric(20,6)' })
  providerAmount!: string;

  /**
   * Valor de provider currency code mantenido por la instancia.
   */
  @Property({ fieldName: 'provider_currency_code', columnType: 'char(3)' })
  providerCurrencyCode!: string;

  /**
   * Valor de provider fee amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'provider_fee_amount',
    columnType: 'numeric(20,6)',
    nullable: true,
  })
  providerFeeAmount?: string;

  /**
   * Valor de settlement reference mantenido por la instancia.
   */
  @Property({
    fieldName: 'settlement_reference',
    columnType: 'varchar',
    nullable: true,
  })
  settlementReference?: string;

  /**
   * Identificador asociado a match status concept.
   */
  @Property({ fieldName: 'match_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  matchStatusConceptId!: string;

  /**
   * Identificador asociado a mismatch reason concept.
   */
  @Property({
    fieldName: 'mismatch_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  mismatchReasonConceptId?: string;

  /**
   * Valor de source record hash mantenido por la instancia.
   */
  @Property({
    fieldName: 'source_record_hash',
    columnType: 'varchar',
    nullable: true,
  })
  sourceRecordHash?: string;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
