import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'insurance', tableName: 'patient_coverages' })
export class PatientCoverages {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  @Property({ fieldName: 'insurance_plan_id', type: 'uuid' }) // FK → insurance.insurance_plans
  insurancePlanId!: string;

  @Property({ fieldName: 'insurance_broker_id', type: 'uuid', nullable: true }) // FK → insurance.insurance_brokers
  insuranceBrokerId?: string;

  @Property({ fieldName: 'employer_group_id', type: 'uuid', nullable: true }) // FK → insurance.employer_groups
  employerGroupId?: string;

  @Property({ fieldName: 'member_identifier', columnType: 'varchar' })
  memberIdentifier!: string;

  @Property({
    fieldName: 'policy_identifier',
    columnType: 'varchar',
    nullable: true,
  })
  policyIdentifier?: string;

  @Property({ fieldName: 'coverage_order', columnType: 'int', nullable: true })
  coverageOrder?: number;

  @Property({
    fieldName: 'relationship_to_subscriber_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  relationshipToSubscriberConceptId?: string;

  @Property({ fieldName: 'effective_from', columnType: 'date', nullable: true })
  effectiveFrom?: Date;

  @Property({ fieldName: 'effective_to', columnType: 'date', nullable: true })
  effectiveTo?: Date;

  @Property({ fieldName: 'verification_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  verificationStatusConceptId!: string;

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
