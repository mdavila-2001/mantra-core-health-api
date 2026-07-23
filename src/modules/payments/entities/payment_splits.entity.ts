import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'payments', tableName: 'payment_splits' })
export class PaymentSplits {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'payment_intent_id', type: 'uuid' }) // FK → payments.payment_intents
  paymentIntentId!: string;

  @Property({ fieldName: 'payee_connected_account_id', type: 'uuid' }) // FK → payments.connected_accounts
  payeeConnectedAccountId!: string;

  @Property({ fieldName: 'split_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  splitTypeConceptId!: string;

  @Property({ columnType: 'numeric', nullable: true })
  amount?: string;

  @Property({ columnType: 'numeric', nullable: true })
  percentage?: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  @Property({ fieldName: 'is_platform_fee', type: 'boolean' })
  isPlatformFee!: boolean;

  @Property({
    fieldName: 'destination_wallet_id',
    type: 'uuid',
    nullable: true,
  }) // FK → payments.wallets
  destinationWalletId?: string;

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
