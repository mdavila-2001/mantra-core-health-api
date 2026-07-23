import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'erp', tableName: 'contract_accounting_terms' })
export class ContractAccountingTerms {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'contract_id', type: 'uuid' }) // FK → erp.contracts
  contractId!: string;

  @Property({
    fieldName: 'contract_line_item_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.contract_line_items
  contractLineItemId?: string;

  @Property({ fieldName: 'accounting_treatment_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  accountingTreatmentConceptId!: string;

  @Property({ fieldName: 'expense_account_id', type: 'uuid', nullable: true }) // FK → accounting.accounts
  expenseAccountId?: string;

  @Property({ fieldName: 'revenue_account_id', type: 'uuid', nullable: true }) // FK → accounting.accounts
  revenueAccountId?: string;

  @Property({ fieldName: 'accrual_account_id', type: 'uuid', nullable: true }) // FK → accounting.accounts
  accrualAccountId?: string;

  @Property({ fieldName: 'asset_account_id', type: 'uuid', nullable: true }) // FK → accounting.accounts
  assetAccountId?: string;

  @Property({ fieldName: 'liability_account_id', type: 'uuid', nullable: true }) // FK → accounting.accounts
  liabilityAccountId?: string;

  @Property({ fieldName: 'cost_center_id', type: 'uuid', nullable: true }) // FK → accounting.cost_centers
  costCenterId?: string;

  @Property({ fieldName: 'profit_center_id', type: 'uuid', nullable: true }) // FK → accounting.profit_centers
  profitCenterId?: string;

  @Property({ fieldName: 'tax_code_id', type: 'uuid', nullable: true }) // FK → billing.tax_codes
  taxCodeId?: string;

  @Property({ fieldName: 'effective_from', columnType: 'date', nullable: true })
  effectiveFrom?: Date;

  @Property({ fieldName: 'effective_to', columnType: 'date', nullable: true })
  effectiveTo?: Date;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
