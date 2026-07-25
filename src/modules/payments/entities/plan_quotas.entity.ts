import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'payments', tableName: 'plan_quotas' })
export class PlanQuotas {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'plan_id', type: 'uuid' }) // FK → payments.subscription_plans
  planId!: string;

  @Property({ fieldName: 'metric_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  metricConceptId!: string;

  @Property({ fieldName: 'limit_value', columnType: 'numeric', nullable: true })
  limitValue?: string;

  @Property({
    fieldName: 'soft_limit_value',
    columnType: 'numeric',
    nullable: true,
  })
  softLimitValue?: string;

  @Property({
    fieldName: 'quota_period_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  quotaPeriodConceptId?: string;

  @Property({
    fieldName: 'overage_policy_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  overagePolicyConceptId?: string;

  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

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
