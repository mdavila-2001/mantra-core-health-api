import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `plan_features`.
 */
@Entity({ schema: 'payments', tableName: 'plan_features' })
export class PlanFeatures {
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
   * Identificador asociado a feature concept.
   */
  @Property({ fieldName: 'feature_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  featureConceptId!: string;

  /**
   * Valor de is enabled mantenido por la instancia.
   */
  @Property({ fieldName: 'is_enabled', type: 'boolean' })
  isEnabled!: boolean;

  /**
   * Valor de limit value mantenido por la instancia.
   */
  @Property({ fieldName: 'limit_value', columnType: 'numeric', nullable: true })
  limitValue?: string;

  /**
   * Valor de value json mantenido por la instancia.
   */
  @Property({
    fieldName: 'value_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  valueJson?: unknown;

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
