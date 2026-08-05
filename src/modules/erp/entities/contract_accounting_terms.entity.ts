import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `contract_accounting_terms`.
 */
@Entity({ schema: 'erp', tableName: 'contract_accounting_terms' })
export class ContractAccountingTerms {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a contract.
   */
  @Property({ fieldName: 'contract_id', type: 'uuid' }) // FK → erp.contracts
  contractId!: string;

  /**
   * Identificador asociado a contract line item.
   */
  @Property({
    fieldName: 'contract_line_item_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.contract_line_items
  contractLineItemId?: string;

  /**
   * Identificador asociado a accounting treatment concept.
   */
  @Property({ fieldName: 'accounting_treatment_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  accountingTreatmentConceptId!: string;

  /**
   * Identificador asociado a expense account.
   */
  @Property({ fieldName: 'expense_account_id', type: 'uuid', nullable: true }) // FK → accounting.accounts
  expenseAccountId?: string;

  /**
   * Identificador asociado a revenue account.
   */
  @Property({ fieldName: 'revenue_account_id', type: 'uuid', nullable: true }) // FK → accounting.accounts
  revenueAccountId?: string;

  /**
   * Identificador asociado a accrual account.
   */
  @Property({ fieldName: 'accrual_account_id', type: 'uuid', nullable: true }) // FK → accounting.accounts
  accrualAccountId?: string;

  /**
   * Identificador asociado a asset account.
   */
  @Property({ fieldName: 'asset_account_id', type: 'uuid', nullable: true }) // FK → accounting.accounts
  assetAccountId?: string;

  /**
   * Identificador asociado a liability account.
   */
  @Property({ fieldName: 'liability_account_id', type: 'uuid', nullable: true }) // FK → accounting.accounts
  liabilityAccountId?: string;

  /**
   * Identificador asociado a cost center.
   */
  @Property({ fieldName: 'cost_center_id', type: 'uuid', nullable: true }) // FK → accounting.cost_centers
  costCenterId?: string;

  /**
   * Identificador asociado a profit center.
   */
  @Property({ fieldName: 'profit_center_id', type: 'uuid', nullable: true }) // FK → accounting.profit_centers
  profitCenterId?: string;

  /**
   * Identificador asociado a tax code.
   */
  @Property({ fieldName: 'tax_code_id', type: 'uuid', nullable: true }) // FK → billing.tax_codes
  taxCodeId?: string;

  /**
   * Valor de effective from mantenido por la instancia.
   */
  @Property({ fieldName: 'effective_from', columnType: 'date', nullable: true })
  effectiveFrom?: Date;

  /**
   * Valor de effective to mantenido por la instancia.
   */
  @Property({ fieldName: 'effective_to', columnType: 'date', nullable: true })
  effectiveTo?: Date;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
