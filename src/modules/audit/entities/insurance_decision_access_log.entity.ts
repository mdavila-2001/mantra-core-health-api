import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'audit', tableName: 'insurance_decision_access_log' })
export class InsuranceDecisionAccessLog {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'insurance_carrier_id', type: 'uuid' }) // FK → insurance.insurance_carriers
  insuranceCarrierId!: string;

  @Property({ fieldName: 'actor_user_id', type: 'uuid' }) // FK → iam.users
  actorUserId!: string;

  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  @Property({ fieldName: 'claim_id', type: 'uuid', nullable: true }) // FK → insurance.insurance_claims
  claimId?: string;

  @Property({
    fieldName: 'authorization_request_id',
    type: 'uuid',
    nullable: true,
  }) // FK → insurance.prior_authorization_requests
  authorizationRequestId?: string;

  @Property({ fieldName: 'action_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  actionConceptId!: string;

  @Property({ fieldName: 'purpose_of_use_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  purposeOfUseConceptId!: string;

  @Property({ fieldName: 'outcome_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  outcomeConceptId!: string;

  @Property({ fieldName: 'occurred_at', columnType: 'timestamptz' })
  occurredAt!: Date;
}
