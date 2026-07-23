import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'erp', tableName: 'lease_accounting_links' })
export class LeaseAccountingLinks {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'lease_contract_id', type: 'uuid' }) // FK → erp.lease_contracts
  leaseContractId!: string;

  @Property({ fieldName: 'lease_object_id', type: 'uuid', nullable: true }) // FK → erp.lease_objects
  leaseObjectId?: string;

  @Property({ fieldName: 'right_of_use_asset_id', type: 'uuid' }) // FK → accounting.assets
  rightOfUseAssetId!: string;

  @Property({ fieldName: 'lease_liability_id', type: 'uuid' }) // FK → accounting.liabilities
  leaseLiabilityId!: string;

  @Property({
    fieldName: 'right_of_use_asset_account_id',
    type: 'uuid',
    nullable: true,
  }) // FK → accounting.accounts
  rightOfUseAssetAccountId?: string;

  @Property({
    fieldName: 'lease_liability_account_id',
    type: 'uuid',
    nullable: true,
  }) // FK → accounting.accounts
  leaseLiabilityAccountId?: string;

  @Property({
    fieldName: 'interest_expense_account_id',
    type: 'uuid',
    nullable: true,
  }) // FK → accounting.accounts
  interestExpenseAccountId?: string;

  @Property({
    fieldName: 'depreciation_expense_account_id',
    type: 'uuid',
    nullable: true,
  }) // FK → accounting.accounts
  depreciationExpenseAccountId?: string;

  @Property({ fieldName: 'valid_from', columnType: 'date', nullable: true })
  validFrom?: Date;

  @Property({ fieldName: 'valid_to', columnType: 'date', nullable: true })
  validTo?: Date;

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
