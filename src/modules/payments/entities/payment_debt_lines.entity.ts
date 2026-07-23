import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'payments', tableName: 'payment_debt_lines' })
export class PaymentDebtLines {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'payment_debt_id', type: 'uuid' }) // FK → payments.payment_debts
  paymentDebtId!: string;

  @Property({ fieldName: 'line_number', columnType: 'int' })
  lineNumber!: number;

  @Property({
    fieldName: 'billable_item_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  billableItemTypeConceptId?: string;

  @Property({ fieldName: 'billable_item_id', type: 'uuid', nullable: true })
  billableItemId?: string;

  @Property({ columnType: 'varchar' })
  description!: string;

  @Property({ columnType: 'numeric(20,6)' })
  quantity!: string;

  @Property({ fieldName: 'unit_amount', columnType: 'numeric(20,6)' })
  unitAmount!: string;

  @Property({ fieldName: 'line_amount', columnType: 'numeric(20,6)' })
  lineAmount!: string;

  @Property({
    fieldName: 'tax_amount',
    columnType: 'numeric(20,6)',
    nullable: true,
  })
  taxAmount?: string;

  @Property({
    fieldName: 'discount_amount',
    columnType: 'numeric(20,6)',
    nullable: true,
  })
  discountAmount?: string;

  @Property({
    fieldName: 'accounting_account_id',
    type: 'uuid',
    nullable: true,
  }) // FK → accounting.accounts
  accountingAccountId?: string;

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
