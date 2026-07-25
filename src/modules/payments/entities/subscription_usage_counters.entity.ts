import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'payments', tableName: 'subscription_usage_counters' })
export class SubscriptionUsageCounters {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'subscription_id', type: 'uuid' }) // FK → payments.subscriptions
  subscriptionId!: string;

  @Property({ fieldName: 'metric_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  metricConceptId!: string;

  @Property({ fieldName: 'period_start', columnType: 'timestamptz' })
  periodStart!: Date;

  @Property({ fieldName: 'period_end', columnType: 'timestamptz' })
  periodEnd!: Date;

  @Property({ fieldName: 'used_value', columnType: 'numeric', nullable: true })
  usedValue?: string;

  @Property({ fieldName: 'limit_value', columnType: 'numeric', nullable: true })
  limitValue?: string;

  @Property({
    fieldName: 'last_event_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastEventAt?: Date;

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
