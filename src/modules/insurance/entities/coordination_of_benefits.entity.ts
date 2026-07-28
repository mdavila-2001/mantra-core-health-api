import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `coordination_of_benefits`.
 */
@Entity({ schema: 'insurance', tableName: 'coordination_of_benefits' })
export class CoordinationOfBenefits {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a patient profile.
   */
  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  /**
   * Identificador asociado a primary patient coverage.
   */
  @Property({ fieldName: 'primary_patient_coverage_id', type: 'uuid' }) // FK → insurance.patient_coverages
  primaryPatientCoverageId!: string;

  /**
   * Identificador asociado a secondary patient coverage.
   */
  @Property({
    fieldName: 'secondary_patient_coverage_id',
    type: 'uuid',
    nullable: true,
  }) // FK → insurance.patient_coverages
  secondaryPatientCoverageId?: string;

  /**
   * Identificador asociado a tertiary patient coverage.
   */
  @Property({
    fieldName: 'tertiary_patient_coverage_id',
    type: 'uuid',
    nullable: true,
  }) // FK → insurance.patient_coverages
  tertiaryPatientCoverageId?: string;

  /**
   * Identificador asociado a cob rule concept.
   */
  @Property({ fieldName: 'cob_rule_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  cobRuleConceptId!: string;

  /**
   * Valor de determination version mantenido por la instancia.
   */
  @Property({ fieldName: 'determination_version', columnType: 'int' })
  determinationVersion!: number;

  /**
   * Identificador asociado a determined by authority concept.
   */
  @Property({
    fieldName: 'determined_by_authority_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  determinedByAuthorityConceptId?: string;

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
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
