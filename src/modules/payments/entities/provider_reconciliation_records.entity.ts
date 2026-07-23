import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'payments', tableName: 'provider_reconciliation_records' })
export class ProviderReconciliationRecords {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'gateway_connection_id', type: 'uuid' }) // FK → payments.gateway_connections
  gatewayConnectionId!: string;

  @Property({ fieldName: 'reconciliation_run_id', type: 'uuid' }) // FK → payments.reconciliation_runs
  reconciliationRunId!: string;

  @Property({ fieldName: 'payment_debt_id', type: 'uuid', nullable: true }) // FK → payments.payment_debts
  paymentDebtId?: string;

  @Property({
    fieldName: 'payment_transaction_id',
    type: 'uuid',
    nullable: true,
  }) // FK → payments.payment_transactions
  paymentTransactionId?: string;

  @Property({ fieldName: 'external_transaction_id', columnType: 'varchar' })
  externalTransactionId!: string;

  @Property({ fieldName: 'provider_status_code', columnType: 'varchar' })
  providerStatusCode!: string;

  @Property({
    fieldName: 'provider_paid_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  providerPaidAt?: Date;

  @Property({ fieldName: 'provider_amount', columnType: 'numeric(20,6)' })
  providerAmount!: string;

  @Property({ fieldName: 'provider_currency_code', columnType: 'char(3)' })
  providerCurrencyCode!: string;

  @Property({
    fieldName: 'provider_fee_amount',
    columnType: 'numeric(20,6)',
    nullable: true,
  })
  providerFeeAmount?: string;

  @Property({
    fieldName: 'settlement_reference',
    columnType: 'varchar',
    nullable: true,
  })
  settlementReference?: string;

  @Property({ fieldName: 'match_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  matchStatusConceptId!: string;

  @Property({
    fieldName: 'mismatch_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  mismatchReasonConceptId?: string;

  @Property({
    fieldName: 'source_record_hash',
    columnType: 'varchar',
    nullable: true,
  })
  sourceRecordHash?: string;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
