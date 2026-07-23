import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'payments', tableName: 'reconciliation_exceptions' })
export class ReconciliationExceptions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'reconciliation_run_id', type: 'uuid' }) // FK → payments.reconciliation_runs
  reconciliationRunId!: string;

  @Property({ fieldName: 'exception_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  exceptionTypeConceptId!: string;

  @Property({
    fieldName: 'payment_transaction_id',
    type: 'uuid',
    nullable: true,
  }) // FK → payments.payment_transactions
  paymentTransactionId?: string;

  @Property({
    fieldName: 'wallet_ledger_entry_id',
    type: 'uuid',
    nullable: true,
  }) // FK → payments.wallet_ledger_entries
  walletLedgerEntryId?: string;

  @Property({
    fieldName: 'external_ref',
    columnType: 'varchar',
    nullable: true,
  })
  externalRef?: string;

  @Property({
    fieldName: 'amount_difference',
    columnType: 'numeric',
    nullable: true,
  })
  amountDifference?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'resolution_text',
    columnType: 'text',
    nullable: true,
  })
  resolutionText?: string;

  @Property({ fieldName: 'resolved_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  resolvedByUserId?: string;

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
