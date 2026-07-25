import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'payments', tableName: 'subscriptions' })
export class Subscriptions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'plan_id', type: 'uuid' }) // FK → payments.subscription_plans
  planId!: string;

  @Property({ fieldName: 'subscriber_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  subscriberTypeConceptId!: string;

  @Property({ fieldName: 'subscriber_ref_id', type: 'uuid' })
  subscriberRefId!: string;

  @Property({ fieldName: 'payment_method_id', type: 'uuid', nullable: true }) // FK → payments.payment_methods
  paymentMethodId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'current_period_start',
    columnType: 'timestamptz',
    nullable: true,
  })
  currentPeriodStart?: Date;

  @Property({
    fieldName: 'current_period_end',
    columnType: 'timestamptz',
    nullable: true,
  })
  currentPeriodEnd?: Date;

  @Property({
    fieldName: 'trial_end_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  trialEndAt?: Date;

  @Property({
    fieldName: 'cancel_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  cancelAt?: Date;

  @Property({
    fieldName: 'canceled_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  canceledAt?: Date;

  @Property({ fieldName: 'mandate_id', type: 'uuid', nullable: true }) // FK → payments.payment_mandates
  mandateId?: string;

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
