import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'health_context', tableName: 'context_quality_reviews' })
export class ContextQualityReviews {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'context_version_id', type: 'uuid' }) // FK (destino no resuelto)
  contextVersionId!: string;

  @Property({ fieldName: 'reviewer_agent_id', type: 'uuid', nullable: true }) // FK → automation.agents
  reviewerAgentId?: string;

  @Property({ fieldName: 'reviewed_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  reviewedByUserId?: string;

  @Property({ fieldName: 'review_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  reviewTypeConceptId!: string;

  @Property({ fieldName: 'outcome_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  outcomeConceptId!: string;

  @Property({
    fieldName: 'issues_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  issuesJson?: unknown;

  @Property({ columnType: 'text', nullable: true })
  notes?: string;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;
}
