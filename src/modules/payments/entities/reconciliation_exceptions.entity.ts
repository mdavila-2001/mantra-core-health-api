import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `reconciliation_exceptions`.
 */
@Entity({ schema: 'payments', tableName: 'reconciliation_exceptions' })
export class ReconciliationExceptions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a reconciliation run.
   */
  @Property({ fieldName: 'reconciliation_run_id', type: 'uuid' }) // FK → payments.reconciliation_runs
  reconciliationRunId!: string;

  /**
   * Identificador asociado a exception type concept.
   */
  @Property({ fieldName: 'exception_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  exceptionTypeConceptId!: string;

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
   * Identificador asociado a wallet ledger entry.
   */
  @Property({
    fieldName: 'wallet_ledger_entry_id',
    type: 'uuid',
    nullable: true,
  }) // FK → payments.wallet_ledger_entries
  walletLedgerEntryId?: string;

  /**
   * Valor de external ref mantenido por la instancia.
   */
  @Property({
    fieldName: 'external_ref',
    columnType: 'varchar',
    nullable: true,
  })
  externalRef?: string;

  /**
   * Valor de amount difference mantenido por la instancia.
   */
  @Property({
    fieldName: 'amount_difference',
    columnType: 'numeric',
    nullable: true,
  })
  amountDifference?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de resolution text mantenido por la instancia.
   */
  @Property({
    fieldName: 'resolution_text',
    columnType: 'text',
    nullable: true,
  })
  resolutionText?: string;

  /**
   * Identificador asociado a resolved by user.
   */
  @Property({ fieldName: 'resolved_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  resolvedByUserId?: string;

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
