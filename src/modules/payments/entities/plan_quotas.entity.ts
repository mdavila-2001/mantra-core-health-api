import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `plan_quotas`.
 */
@Entity({ schema: 'payments', tableName: 'plan_quotas' })
export class PlanQuotas {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a plan.
   */
  @Property({ fieldName: 'plan_id', type: 'uuid' }) // FK → payments.subscription_plans
  planId!: string;

  /**
   * Identificador asociado a metric concept.
   */
  @Property({ fieldName: 'metric_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  metricConceptId!: string;

  /**
   * Valor de limit value mantenido por la instancia.
   */
  @Property({ fieldName: 'limit_value', columnType: 'numeric', nullable: true })
  limitValue?: string;

  /**
   * Valor de soft limit value mantenido por la instancia.
   */
  @Property({
    fieldName: 'soft_limit_value',
    columnType: 'numeric',
    nullable: true,
  })
  softLimitValue?: string;

  /**
   * Identificador asociado a quota period concept.
   */
  @Property({
    fieldName: 'quota_period_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  quotaPeriodConceptId?: string;

  /**
   * Identificador asociado a overage policy concept.
   */
  @Property({
    fieldName: 'overage_policy_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  overagePolicyConceptId?: string;

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
