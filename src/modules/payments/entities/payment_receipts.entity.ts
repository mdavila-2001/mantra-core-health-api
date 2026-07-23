import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'payments', tableName: 'payment_receipts' })
export class PaymentReceipts {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'payment_transaction_id', type: 'uuid' }) // FK → payments.payment_transactions
  paymentTransactionId!: string;

  @Property({ fieldName: 'payment_debt_id', type: 'uuid', nullable: true }) // FK → payments.payment_debts
  paymentDebtId?: string;

  @Property({ fieldName: 'receipt_number', columnType: 'varchar' })
  receiptNumber!: string;

  @Property({ fieldName: 'issued_at', columnType: 'timestamptz' })
  issuedAt!: Date;

  @Property({ columnType: 'numeric(20,6)' })
  amount!: string;

  @Property({ fieldName: 'currency_code', columnType: 'char(3)' })
  currencyCode!: string;

  @Property({
    fieldName: 'payer_business_partner_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.business_partners
  payerBusinessPartnerId?: string;

  @Property({ fieldName: 'file_id', type: 'uuid', nullable: true }) // FK → common.files
  fileId?: string;

  @Property({
    fieldName: 'content_hash',
    columnType: 'varchar',
    nullable: true,
  })
  contentHash?: string;

  @Property({
    fieldName: 'voided_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  voidedAt?: Date;

  @Property({ fieldName: 'void_reason', columnType: 'text', nullable: true })
  voidReason?: string;

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
