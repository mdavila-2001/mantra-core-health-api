import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'insurance', tableName: 'coordination_of_benefits' })
export class CoordinationOfBenefits {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  @Property({ fieldName: 'primary_patient_coverage_id', type: 'uuid' }) // FK → insurance.patient_coverages
  primaryPatientCoverageId!: string;

  @Property({
    fieldName: 'secondary_patient_coverage_id',
    type: 'uuid',
    nullable: true,
  }) // FK → insurance.patient_coverages
  secondaryPatientCoverageId?: string;

  @Property({
    fieldName: 'tertiary_patient_coverage_id',
    type: 'uuid',
    nullable: true,
  }) // FK → insurance.patient_coverages
  tertiaryPatientCoverageId?: string;

  @Property({ fieldName: 'cob_rule_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  cobRuleConceptId!: string;

  @Property({ fieldName: 'determination_version', columnType: 'int' })
  determinationVersion!: number;

  @Property({
    fieldName: 'determined_by_authority_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  determinedByAuthorityConceptId?: string;

  @Property({ fieldName: 'effective_from', columnType: 'date' })
  effectiveFrom!: Date;

  @Property({ fieldName: 'effective_to', columnType: 'date', nullable: true })
  effectiveTo?: Date;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
