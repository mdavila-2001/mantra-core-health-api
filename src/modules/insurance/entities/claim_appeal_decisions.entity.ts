import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'insurance', tableName: 'claim_appeal_decisions' })
export class ClaimAppealDecisions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'claim_dispute_id', type: 'uuid' }) // FK → insurance.claim_disputes
  claimDisputeId!: string;

  @Property({ fieldName: 'appeal_level_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  appealLevelConceptId!: string;

  @Property({ fieldName: 'decision_version', columnType: 'int' })
  decisionVersion!: number;

  @Property({ fieldName: 'decision_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  decisionConceptId!: string;

  @Property({
    fieldName: 'adjusted_amount',
    columnType: 'numeric',
    nullable: true,
  })
  adjustedAmount?: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  @Property({ fieldName: 'rationale_text', columnType: 'text', nullable: true })
  rationaleText?: string;

  @Property({
    fieldName: 'supersedes_decision_id',
    type: 'uuid',
    nullable: true,
  }) // FK → insurance.claim_appeal_decisions
  supersedesDecisionId?: string;

  @Property({
    fieldName: 'decided_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  decidedAt?: Date;

  @Property({
    fieldName: 'decided_by_reviewer_user_id',
    type: 'uuid',
    nullable: true,
  }) // FK → iam.users
  decidedByReviewerUserId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
