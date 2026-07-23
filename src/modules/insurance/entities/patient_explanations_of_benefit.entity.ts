import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'insurance', tableName: 'patient_explanations_of_benefit' })
export class PatientExplanationsOfBenefit {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'insurance_claim_id', type: 'uuid' }) // FK → insurance.insurance_claims
  insuranceClaimId!: string;

  @Property({ fieldName: 'claim_adjudication_version_id', type: 'uuid' }) // FK → insurance.claim_adjudication_versions
  claimAdjudicationVersionId!: string;

  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  @Property({ fieldName: 'document_record_id', type: 'uuid', nullable: true }) // FK → chart.document_records
  documentRecordId?: string;

  @Property({
    fieldName: 'published_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  publishedAt?: Date;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
