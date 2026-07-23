import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'accounting', tableName: 'liability_payments' })
export class LiabilityPayments {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'liability_id', type: 'uuid' }) // FK → accounting.liabilities
  liabilityId!: string;

  @Property({ fieldName: 'transaction_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  transactionId?: string;

  @Property({ columnType: 'numeric' })
  amount!: string;

  @Property({
    fieldName: 'principal_component',
    columnType: 'numeric',
    nullable: true,
  })
  principalComponent?: string;

  @Property({
    fieldName: 'interest_component',
    columnType: 'numeric',
    nullable: true,
  })
  interestComponent?: string;

  @Property({ fieldName: 'paid_at', columnType: 'timestamptz', nullable: true })
  paidAt?: Date;

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
