import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `context_quality_reviews`.
 */
@Entity({ schema: 'health_context', tableName: 'context_quality_reviews' })
export class ContextQualityReviews {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a context version.
   */
  @Property({ fieldName: 'context_version_id', type: 'uuid' }) // FK → health_context.country_health_context_versions
  contextVersionId!: string;

  /**
   * Identificador asociado a reviewer agent.
   */
  @Property({ fieldName: 'reviewer_agent_id', type: 'uuid', nullable: true }) // FK → automation.agents
  reviewerAgentId?: string;

  /**
   * Identificador asociado a reviewed by user.
   */
  @Property({ fieldName: 'reviewed_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  reviewedByUserId?: string;

  /**
   * Identificador asociado a review type concept.
   */
  @Property({ fieldName: 'review_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  reviewTypeConceptId!: string;

  /**
   * Identificador asociado a outcome concept.
   */
  @Property({ fieldName: 'outcome_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  outcomeConceptId!: string;

  /**
   * Valor de issues json mantenido por la instancia.
   */
  @Property({
    fieldName: 'issues_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  issuesJson?: unknown;

  /**
   * Valor de notes mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  notes?: string;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;
}
