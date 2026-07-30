import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `ledger_entries`.
 */
@Entity({ schema: 'accounting', tableName: 'ledger_entries' })
export class LedgerEntries {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a transaction.
   */
  @Property({ fieldName: 'transaction_id', type: 'uuid' }) // FK → accounting.journal_transactions
  transactionId!: string;

  /**
   * Identificador asociado a account.
   */
  @Property({ fieldName: 'account_id', type: 'uuid' }) // FK → accounting.accounts
  accountId!: string;

  /**
   * Identificador asociado a cost center.
   */
  @Property({ fieldName: 'cost_center_id', type: 'uuid', nullable: true }) // FK → accounting.cost_centers
  costCenterId?: string;

  /**
   * Identificador asociado a direction concept.
   */
  @Property({ fieldName: 'direction_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  directionConceptId!: string;

  /**
   * Valor de amount mantenido por la instancia.
   */
  @Property({ columnType: 'numeric' })
  amount!: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  /**
   * Valor de fx rate mantenido por la instancia.
   */
  @Property({ fieldName: 'fx_rate', columnType: 'numeric', nullable: true })
  fxRate?: string;

  /**
   * Valor de amount base mantenido por la instancia.
   */
  @Property({ fieldName: 'amount_base', columnType: 'numeric', nullable: true })
  amountBase?: string;

  /**
   * Valor de line no mantenido por la instancia.
   */
  @Property({ fieldName: 'line_no', columnType: 'int' })
  lineNo!: number;

  /**
   * Valor de memo mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  memo?: string;

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
