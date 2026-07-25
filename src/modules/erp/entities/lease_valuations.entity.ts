import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'erp', tableName: 'lease_valuations' })
export class LeaseValuations {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'lease_contract_id', type: 'uuid' }) // FK → erp.lease_contracts
  leaseContractId!: string;

  @Property({ fieldName: 'valuation_date', columnType: 'date' })
  valuationDate!: Date;

  @Property({
    fieldName: 'accounting_principle_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  accountingPrincipleConceptId?: string;

  @Property({
    fieldName: 'right_of_use_asset_value',
    columnType: 'numeric',
    nullable: true,
  })
  rightOfUseAssetValue?: string;

  @Property({
    fieldName: 'lease_liability_value',
    columnType: 'numeric',
    nullable: true,
  })
  leaseLiabilityValue?: string;

  @Property({
    fieldName: 'interest_expense',
    columnType: 'numeric',
    nullable: true,
  })
  interestExpense?: string;

  @Property({
    fieldName: 'depreciation_expense',
    columnType: 'numeric',
    nullable: true,
  })
  depreciationExpense?: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  @Property({
    fieldName: 'journal_transaction_id',
    type: 'uuid',
    nullable: true,
  }) // FK → accounting.journal_transactions
  journalTransactionId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
