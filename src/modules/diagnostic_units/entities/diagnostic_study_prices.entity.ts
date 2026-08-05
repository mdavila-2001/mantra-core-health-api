import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `diagnostic_study_prices`.
 */
@Entity({ schema: 'diagnostic_units', tableName: 'diagnostic_study_prices' })
export class DiagnosticStudyPrices {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a price schedule.
   */
  @Property({ fieldName: 'price_schedule_id', type: 'uuid' }) // FK → diagnostic_units.diagnostic_price_schedules
  priceScheduleId!: string;

  /**
   * Identificador asociado a diagnostic study offering.
   */
  @Property({ fieldName: 'diagnostic_study_offering_id', type: 'uuid' }) // FK → diagnostic_units.diagnostic_study_offerings
  diagnosticStudyOfferingId!: string;

  /**
   * Valor de version number mantenido por la instancia.
   */
  @Property({ fieldName: 'version_number', columnType: 'int' })
  versionNumber!: number;

  /**
   * Valor de base amount mantenido por la instancia.
   */
  @Property({ fieldName: 'base_amount', columnType: 'numeric' })
  baseAmount!: string;

  /**
   * Valor de patient amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'patient_amount',
    columnType: 'numeric',
    nullable: true,
  })
  patientAmount?: string;

  /**
   * Valor de insurer amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'insurer_amount',
    columnType: 'numeric',
    nullable: true,
  })
  insurerAmount?: string;

  /**
   * Valor de tax amount mantenido por la instancia.
   */
  @Property({ fieldName: 'tax_amount', columnType: 'numeric', nullable: true })
  taxAmount?: string;

  /**
   * Valor de discount factor mantenido por la instancia.
   */
  @Property({
    fieldName: 'discount_factor',
    columnType: 'numeric',
    nullable: true,
  })
  discountFactor?: string;

  /**
   * Valor de pricing rule json mantenido por la instancia.
   */
  @Property({
    fieldName: 'pricing_rule_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  pricingRuleJson?: unknown;

  /**
   * Valor de effective from mantenido por la instancia.
   */
  @Property({ fieldName: 'effective_from', columnType: 'timestamptz' })
  effectiveFrom!: Date;

  /**
   * Valor de effective to mantenido por la instancia.
   */
  @Property({
    fieldName: 'effective_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveTo?: Date;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  /**
   * Identificador asociado a recorded by user.
   */
  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
