import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'accounting', tableName: 'asset_classes' })
export class AssetClasses {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({
    fieldName: 'asset_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  assetTypeConceptId?: string;

  @Property({
    fieldName: 'acquisition_account_id',
    type: 'uuid',
    nullable: true,
  }) // FK → accounting.accounts
  acquisitionAccountId?: string;

  @Property({
    fieldName: 'accumulated_depreciation_account_id',
    type: 'uuid',
    nullable: true,
  }) // FK → accounting.accounts
  accumulatedDepreciationAccountId?: string;

  @Property({
    fieldName: 'depreciation_expense_account_id',
    type: 'uuid',
    nullable: true,
  }) // FK → accounting.accounts
  depreciationExpenseAccountId?: string;

  @Property({ fieldName: 'gain_account_id', type: 'uuid', nullable: true }) // FK → accounting.accounts
  gainAccountId?: string;

  @Property({ fieldName: 'loss_account_id', type: 'uuid', nullable: true }) // FK → accounting.accounts
  lossAccountId?: string;

  @Property({
    fieldName: 'default_useful_life_months',
    columnType: 'int',
    nullable: true,
  })
  defaultUsefulLifeMonths?: number;

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
