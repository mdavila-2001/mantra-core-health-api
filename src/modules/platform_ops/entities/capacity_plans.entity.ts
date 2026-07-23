import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'platform_ops', tableName: 'capacity_plans' })
export class CapacityPlans {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'service_component_id', type: 'uuid' }) // FK → platform_ops.service_components
  serviceComponentId!: string;

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ fieldName: 'planning_horizon_start', columnType: 'date' })
  planningHorizonStart!: Date;

  @Property({ fieldName: 'planning_horizon_end', columnType: 'date' })
  planningHorizonEnd!: Date;

  @Property({
    fieldName: 'demand_forecast_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  demandForecastJson?: unknown;

  @Property({
    fieldName: 'scaling_policy_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  scalingPolicyJson?: unknown;

  @Property({
    fieldName: 'cost_guardrails_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  costGuardrailsJson?: unknown;

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
