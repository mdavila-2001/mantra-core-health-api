import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'insurance', tableName: 'claim_adjudication_versions' })
export class ClaimAdjudicationVersions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'insurance_claim_id', type: 'uuid' }) // FK → insurance.insurance_claims
  insuranceClaimId!: string;

  @Property({ fieldName: 'adjudication_version', columnType: 'int' })
  adjudicationVersion!: number;

  @Property({ fieldName: 'outcome_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  outcomeConceptId!: string;

  @Property({
    fieldName: 'disposition_text',
    columnType: 'text',
    nullable: true,
  })
  dispositionText?: string;

  @Property({
    fieldName: 'total_approved_amount',
    columnType: 'numeric',
    nullable: true,
  })
  totalApprovedAmount?: string;

  @Property({
    fieldName: 'total_patient_amount',
    columnType: 'numeric',
    nullable: true,
  })
  totalPatientAmount?: string;

  @Property({
    fieldName: 'total_denied_amount',
    columnType: 'numeric',
    nullable: true,
  })
  totalDeniedAmount?: string;

  @Property({
    fieldName: 'supersedes_version_id',
    type: 'uuid',
    nullable: true,
  }) // FK → insurance.claim_adjudication_versions
  supersedesVersionId?: string;

  @Property({ fieldName: 'adjudicated_at', columnType: 'timestamptz' })
  adjudicatedAt!: Date;

  @Property({
    fieldName: 'adjudicated_by_user_id',
    type: 'uuid',
    nullable: true,
  }) // FK → iam.users
  adjudicatedByUserId?: string;
}
