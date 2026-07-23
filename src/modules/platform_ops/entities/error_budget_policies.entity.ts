import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'platform_ops', tableName: 'error_budget_policies' })
export class ErrorBudgetPolicies {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'service_level_objective_id', type: 'uuid' }) // FK → platform_ops.service_level_objectives
  serviceLevelObjectiveId!: string;

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ fieldName: 'budget_percent', columnType: 'numeric(8,5)' })
  budgetPercent!: string;

  @Property({
    fieldName: 'burn_rate_warning',
    columnType: 'numeric(12,6)',
    nullable: true,
  })
  burnRateWarning?: string;

  @Property({
    fieldName: 'burn_rate_critical',
    columnType: 'numeric(12,6)',
    nullable: true,
  })
  burnRateCritical?: string;

  @Property({
    fieldName: 'deployment_freeze_on_exhaustion',
    type: 'boolean',
    nullable: true,
  })
  deploymentFreezeOnExhaustion?: boolean;

  @Property({
    fieldName: 'required_approval_role_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  requiredApprovalRoleConceptId?: string;

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
