import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `liability_payments`.
 */
@Entity({ schema: 'accounting', tableName: 'liability_payments' })
export class LiabilityPayments {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a liability.
   */
  @Property({ fieldName: 'liability_id', type: 'uuid' }) // FK → accounting.liabilities
  liabilityId!: string;

  /**
   * Identificador asociado a transaction.
   */
  @Property({ fieldName: 'transaction_id', type: 'uuid', nullable: true }) // FK → accounting.journal_transactions
  transactionId?: string;

  /**
   * Valor de amount mantenido por la instancia.
   */
  @Property({ columnType: 'numeric' })
  amount!: string;

  /**
   * Valor de principal component mantenido por la instancia.
   */
  @Property({
    fieldName: 'principal_component',
    columnType: 'numeric',
    nullable: true,
  })
  principalComponent?: string;

  /**
   * Valor de interest component mantenido por la instancia.
   */
  @Property({
    fieldName: 'interest_component',
    columnType: 'numeric',
    nullable: true,
  })
  interestComponent?: string;

  /**
   * Valor de paid at mantenido por la instancia.
   */
  @Property({ fieldName: 'paid_at', columnType: 'timestamptz', nullable: true })
  paidAt?: Date;

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
