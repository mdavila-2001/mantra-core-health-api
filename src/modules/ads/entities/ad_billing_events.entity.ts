import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'ad_billing_events' })
export class AdBillingEvents {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'ad_account_id', type: 'uuid' }) // FK → ads.ad_accounts
  adAccountId!: string;

  @Property({ fieldName: 'billing_event_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  billingEventTypeConceptId!: string;

  @Property({ columnType: 'numeric' })
  amount!: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  currencyConceptId!: string;

  @Property({ fieldName: 'period_start', columnType: 'date', nullable: true })
  periodStart?: Date;

  @Property({ fieldName: 'period_end', columnType: 'date', nullable: true })
  periodEnd?: Date;

  @Property({
    fieldName: 'external_billing_ref',
    columnType: 'varchar',
    nullable: true,
  })
  externalBillingRef?: string;

  @Property({
    fieldName: 'occurred_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  occurredAt?: Date;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
