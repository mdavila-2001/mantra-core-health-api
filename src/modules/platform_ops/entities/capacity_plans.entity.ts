import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `capacity_plans`.
 */
@Entity({ schema: 'platform_ops', tableName: 'capacity_plans' })
export class CapacityPlans {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a service component.
   */
  @Property({ fieldName: 'service_component_id', type: 'uuid' }) // FK → platform_ops.service_components
  serviceComponentId!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Valor de planning horizon start mantenido por la instancia.
   */
  @Property({ fieldName: 'planning_horizon_start', columnType: 'date' })
  planningHorizonStart!: Date;

  /**
   * Valor de planning horizon end mantenido por la instancia.
   */
  @Property({ fieldName: 'planning_horizon_end', columnType: 'date' })
  planningHorizonEnd!: Date;

  /**
   * Valor de demand forecast json mantenido por la instancia.
   */
  @Property({
    fieldName: 'demand_forecast_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  demandForecastJson?: unknown;

  /**
   * Valor de scaling policy json mantenido por la instancia.
   */
  @Property({
    fieldName: 'scaling_policy_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  scalingPolicyJson?: unknown;

  /**
   * Valor de cost guardrails json mantenido por la instancia.
   */
  @Property({
    fieldName: 'cost_guardrails_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  costGuardrailsJson?: unknown;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
