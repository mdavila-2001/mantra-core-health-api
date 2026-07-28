import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `error_budget_policies`.
 */
@Entity({ schema: 'platform_ops', tableName: 'error_budget_policies' })
export class ErrorBudgetPolicies {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a service level objective.
   */
  @Property({ fieldName: 'service_level_objective_id', type: 'uuid' }) // FK → platform_ops.service_level_objectives
  serviceLevelObjectiveId!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Valor de budget percent mantenido por la instancia.
   */
  @Property({ fieldName: 'budget_percent', columnType: 'numeric(8,5)' })
  budgetPercent!: string;

  /**
   * Valor de burn rate warning mantenido por la instancia.
   */
  @Property({
    fieldName: 'burn_rate_warning',
    columnType: 'numeric(12,6)',
    nullable: true,
  })
  burnRateWarning?: string;

  /**
   * Valor de burn rate critical mantenido por la instancia.
   */
  @Property({
    fieldName: 'burn_rate_critical',
    columnType: 'numeric(12,6)',
    nullable: true,
  })
  burnRateCritical?: string;

  /**
   * Valor de deployment freeze on exhaustion mantenido por la instancia.
   */
  @Property({
    fieldName: 'deployment_freeze_on_exhaustion',
    type: 'boolean',
    nullable: true,
  })
  deploymentFreezeOnExhaustion?: boolean;

  /**
   * Identificador asociado a required approval role concept.
   */
  @Property({
    fieldName: 'required_approval_role_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  requiredApprovalRoleConceptId?: string;

  /**
   * Identificador asociado a state concept.
   */
  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

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
