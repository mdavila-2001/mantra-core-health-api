import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'insurance', tableName: 'coverage_eligibility_responses' })
export class CoverageEligibilityResponses {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'coverage_eligibility_request_id', type: 'uuid' }) // FK → insurance.coverage_eligibility_requests
  coverageEligibilityRequestId!: string;

  @Property({ fieldName: 'response_version', columnType: 'int' })
  responseVersion!: number;

  @Property({ fieldName: 'in_force', type: 'boolean' })
  inForce!: boolean;

  @Property({
    fieldName: 'benefit_summary_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  benefitSummaryJson?: unknown;

  @Property({
    fieldName: 'authorization_requirements_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  authorizationRequirementsJson?: unknown;

  @Property({
    fieldName: 'response_reference',
    columnType: 'varchar',
    nullable: true,
  })
  responseReference?: string;

  @Property({ fieldName: 'outcome_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  outcomeConceptId!: string;

  @Property({ fieldName: 'responded_at', columnType: 'timestamptz' })
  respondedAt!: Date;

  @Property({ fieldName: 'responded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  respondedByUserId?: string;
}
