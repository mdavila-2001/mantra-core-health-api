import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'payments', tableName: 'plan_quotas' })
export class PlanQuotas {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'plan_id', type: 'uuid' })
  planId!: string;

  @Property({ fieldName: 'metric_concept_id', type: 'uuid' })
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
  })
  quotaPeriodConceptId?: string;

  @Property({
    fieldName: 'overage_policy_concept_id',
    type: 'uuid',
    nullable: true,
  })
  overagePolicyConceptId?: string;

  @Property({ fieldName: 'state_concept_id', type: 'uuid' })
  stateConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true })
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
