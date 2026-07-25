import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'diagnostic_units', tableName: 'diagnostic_study_prices' })
export class DiagnosticStudyPrices {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'price_schedule_id', type: 'uuid' }) // FK → diagnostic_units.diagnostic_price_schedules
  priceScheduleId!: string;

  @Property({ fieldName: 'diagnostic_study_offering_id', type: 'uuid' }) // FK → diagnostic_units.diagnostic_study_offerings
  diagnosticStudyOfferingId!: string;

  @Property({ fieldName: 'version_number', columnType: 'int' })
  versionNumber!: number;

  @Property({ fieldName: 'base_amount', columnType: 'numeric' })
  baseAmount!: string;

  @Property({
    fieldName: 'patient_amount',
    columnType: 'numeric',
    nullable: true,
  })
  patientAmount?: string;

  @Property({
    fieldName: 'insurer_amount',
    columnType: 'numeric',
    nullable: true,
  })
  insurerAmount?: string;

  @Property({ fieldName: 'tax_amount', columnType: 'numeric', nullable: true })
  taxAmount?: string;

  @Property({
    fieldName: 'discount_factor',
    columnType: 'numeric',
    nullable: true,
  })
  discountFactor?: string;

  @Property({
    fieldName: 'pricing_rule_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  pricingRuleJson?: unknown;

  @Property({ fieldName: 'effective_from', columnType: 'timestamptz' })
  effectiveFrom!: Date;

  @Property({
    fieldName: 'effective_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveTo?: Date;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
