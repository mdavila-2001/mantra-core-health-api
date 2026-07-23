import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'platform_ops', tableName: 'error_budget_burn_events' })
export class ErrorBudgetBurnEvents {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'error_budget_policy_id', type: 'uuid' }) // FK → platform_ops.error_budget_policies
  errorBudgetPolicyId!: string;

  @Property({ fieldName: 'occurred_at', columnType: 'timestamptz' })
  occurredAt!: Date;

  @Property({ fieldName: 'window_seconds', type: 'bigint' })
  windowSeconds!: string;

  @Property({ fieldName: 'burn_rate', columnType: 'numeric(12,6)' })
  burnRate!: string;

  @Property({
    fieldName: 'remaining_budget_percent',
    columnType: 'numeric(8,5)',
  })
  remainingBudgetPercent!: string;

  @Property({ fieldName: 'severity_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  severityConceptId!: string;

  @Property({ fieldName: 'health_incident_id', type: 'uuid', nullable: true }) // FK → platform_ops.health_incidents
  healthIncidentId?: string;

  @Property({
    fieldName: 'action_taken_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  actionTakenJson?: unknown;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
