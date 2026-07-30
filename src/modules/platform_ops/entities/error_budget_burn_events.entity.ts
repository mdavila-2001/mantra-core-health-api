import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `error_budget_burn_events`.
 */
@Entity({ schema: 'platform_ops', tableName: 'error_budget_burn_events' })
export class ErrorBudgetBurnEvents {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a error budget policy.
   */
  @Property({ fieldName: 'error_budget_policy_id', type: 'uuid' }) // FK → platform_ops.error_budget_policies
  errorBudgetPolicyId!: string;

  /**
   * Valor de occurred at mantenido por la instancia.
   */
  @Property({ fieldName: 'occurred_at', columnType: 'timestamptz' })
  occurredAt!: Date;

  /**
   * Valor de window seconds mantenido por la instancia.
   */
  @Property({ fieldName: 'window_seconds', type: 'bigint' })
  windowSeconds!: string;

  /**
   * Valor de burn rate mantenido por la instancia.
   */
  @Property({ fieldName: 'burn_rate', columnType: 'numeric(12,6)' })
  burnRate!: string;

  /**
   * Valor de remaining budget percent mantenido por la instancia.
   */
  @Property({
    fieldName: 'remaining_budget_percent',
    columnType: 'numeric(8,5)',
  })
  remainingBudgetPercent!: string;

  /**
   * Identificador asociado a severity concept.
   */
  @Property({ fieldName: 'severity_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  severityConceptId!: string;

  /**
   * Identificador asociado a health incident.
   */
  @Property({ fieldName: 'health_incident_id', type: 'uuid', nullable: true }) // FK → platform_ops.health_incidents
  healthIncidentId?: string;

  /**
   * Valor de action taken json mantenido por la instancia.
   */
  @Property({
    fieldName: 'action_taken_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  actionTakenJson?: unknown;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
