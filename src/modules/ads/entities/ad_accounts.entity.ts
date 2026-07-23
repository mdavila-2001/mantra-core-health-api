import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'ad_accounts' })
export class AdAccounts {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'business_manager_id', type: 'uuid' }) // FK → ads.business_managers
  businessManagerId!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'external_account_ref', columnType: 'varchar' })
  externalAccountRef!: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  currencyConceptId!: string;

  @Property({ fieldName: 'time_zone', columnType: 'varchar', nullable: true })
  timeZone?: string;

  @Property({ fieldName: 'account_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  accountStatusConceptId!: string;

  @Property({
    fieldName: 'spend_cap_amount',
    columnType: 'numeric',
    nullable: true,
  })
  spendCapAmount?: string;

  @Property({
    fieldName: 'amount_spent',
    columnType: 'numeric',
    nullable: true,
  })
  amountSpent?: string;

  @Property({
    fieldName: 'funding_payment_method_id',
    type: 'uuid',
    nullable: true,
  }) // FK → payments.payment_methods
  fundingPaymentMethodId?: string;

  @Property({
    fieldName: 'disable_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  disableReasonConceptId?: string;

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
