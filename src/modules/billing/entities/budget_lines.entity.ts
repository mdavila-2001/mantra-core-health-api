import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'billing', tableName: 'budget_lines' })
export class BudgetLines {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'budget_id', type: 'uuid' }) // FK → billing.budgets
  budgetId!: string;

  @Property({ fieldName: 'account_id', type: 'uuid' }) // FK → accounting.accounts
  accountId!: string;

  @Property({ fieldName: 'cost_center_id', type: 'uuid', nullable: true }) // FK → accounting.cost_centers
  costCenterId?: string;

  @Property({ fieldName: 'fiscal_period_id', type: 'uuid', nullable: true }) // FK → accounting.fiscal_periods
  fiscalPeriodId?: string;

  @Property({ columnType: 'numeric' })
  amount!: string;

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
