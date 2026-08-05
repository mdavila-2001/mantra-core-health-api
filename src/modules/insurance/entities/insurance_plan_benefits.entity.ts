import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `insurance_plan_benefits`.
 */
@Entity({ schema: 'insurance', tableName: 'insurance_plan_benefits' })
export class InsurancePlanBenefits {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a insurance plan.
   */
  @Property({ fieldName: 'insurance_plan_id', type: 'uuid' }) // FK → insurance.insurance_plans
  insurancePlanId!: string;

  /**
   * Identificador asociado a benefit category concept.
   */
  @Property({ fieldName: 'benefit_category_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  benefitCategoryConceptId!: string;

  /**
   * Identificador asociado a service concept.
   */
  @Property({ fieldName: 'service_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  serviceConceptId?: string;

  /**
   * Valor de coverage percent mantenido por la instancia.
   */
  @Property({
    fieldName: 'coverage_percent',
    columnType: 'numeric',
    nullable: true,
  })
  coveragePercent?: string;

  /**
   * Valor de copay amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'copay_amount',
    columnType: 'numeric',
    nullable: true,
  })
  copayAmount?: string;

  /**
   * Valor de deductible amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'deductible_amount',
    columnType: 'numeric',
    nullable: true,
  })
  deductibleAmount?: string;

  /**
   * Valor de annual limit amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'annual_limit_amount',
    columnType: 'numeric',
    nullable: true,
  })
  annualLimitAmount?: string;

  /**
   * Valor de requires prior authorization mantenido por la instancia.
   */
  @Property({
    fieldName: 'requires_prior_authorization',
    type: 'boolean',
    nullable: true,
  })
  requiresPriorAuthorization?: boolean;

  /**
   * Valor de eligibility rule json mantenido por la instancia.
   */
  @Property({
    fieldName: 'eligibility_rule_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  eligibilityRuleJson?: unknown;

  /**
   * Valor de effective from mantenido por la instancia.
   */
  @Property({ fieldName: 'effective_from', columnType: 'date' })
  effectiveFrom!: Date;

  /**
   * Valor de effective to mantenido por la instancia.
   */
  @Property({ fieldName: 'effective_to', columnType: 'date', nullable: true })
  effectiveTo?: Date;

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
