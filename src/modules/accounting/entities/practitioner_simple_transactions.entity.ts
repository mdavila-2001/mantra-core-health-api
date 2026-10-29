import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `practitioner_simple_transactions`.
 *
 * Una transacción debe/haber de la contabilidad simple del doctor (P49). No es
 * un asiento del libro mayor: no toca `accounting.journal_transactions`.
 */
@Entity({
  schema: 'accounting',
  tableName: 'practitioner_simple_transactions',
})
export class PractitionerSimpleTransactions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a practice.
   */
  @Property({ fieldName: 'practice_id', type: 'uuid' }) // FK → practice.practices
  practiceId!: string;

  /**
   * Fecha de la transacción.
   */
  @Property({ fieldName: 'transaction_date', columnType: 'date' })
  transactionDate!: Date;

  /**
   * Descripción libre de la transacción.
   */
  @Property({ columnType: 'varchar' })
  description!: string;

  /**
   * Cuenta del debe.
   */
  @Property({ fieldName: 'debit_account_id', type: 'uuid' }) // FK → accounting.practitioner_simple_accounts
  debitAccountId!: string;

  /**
   * Cuenta del haber; distinta de la del debe.
   */
  @Property({ fieldName: 'credit_account_id', type: 'uuid' }) // FK → accounting.practitioner_simple_accounts
  creditAccountId!: string;

  /**
   * Importe, siempre positivo.
   */
  @Property({ columnType: 'numeric' })
  amount!: string;

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
