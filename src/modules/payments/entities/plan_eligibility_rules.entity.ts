import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `plan_eligibility_rules`.
 */
@Entity({ schema: 'payments', tableName: 'plan_eligibility_rules' })
export class PlanEligibilityRules {
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
   * Identificador asociado a eligible practice type concept.
   */
  @Property({ fieldName: 'eligible_practice_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  eligiblePracticeTypeConceptId!: string;

  /**
   * Valor de is included mantenido por la instancia.
   */
  @Property({ fieldName: 'is_included', type: 'boolean' })
  isIncluded!: boolean;

  /**
   * Valor de notes mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  notes?: string;

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
