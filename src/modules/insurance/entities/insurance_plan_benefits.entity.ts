import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'insurance', tableName: 'insurance_plan_benefits' })
export class InsurancePlanBenefits {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'insurance_plan_id', type: 'uuid' }) // FK → insurance.insurance_plans
  insurancePlanId!: string;

  @Property({ fieldName: 'benefit_category_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  benefitCategoryConceptId!: string;

  @Property({ fieldName: 'service_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  serviceConceptId?: string;

  @Property({
    fieldName: 'coverage_percent',
    columnType: 'numeric',
    nullable: true,
  })
  coveragePercent?: string;

  @Property({
    fieldName: 'copay_amount',
    columnType: 'numeric',
    nullable: true,
  })
  copayAmount?: string;

  @Property({
    fieldName: 'deductible_amount',
    columnType: 'numeric',
    nullable: true,
  })
  deductibleAmount?: string;

  @Property({
    fieldName: 'annual_limit_amount',
    columnType: 'numeric',
    nullable: true,
  })
  annualLimitAmount?: string;

  @Property({
    fieldName: 'requires_prior_authorization',
    type: 'boolean',
    nullable: true,
  })
  requiresPriorAuthorization?: boolean;

  @Property({
    fieldName: 'eligibility_rule_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  eligibilityRuleJson?: unknown;

  @Property({ fieldName: 'effective_from', columnType: 'date' })
  effectiveFrom!: Date;

  @Property({ fieldName: 'effective_to', columnType: 'date', nullable: true })
  effectiveTo?: Date;

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
