import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'health_context', tableName: 'context_fact_evidence' })
export class ContextFactEvidence {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'health_context_fact_id', type: 'uuid' }) // FK → health_context.health_context_facts
  healthContextFactId!: string;

  @Property({ fieldName: 'source_observation_id', type: 'uuid' }) // FK → clinical.observations
  sourceObservationId!: string;

  @Property({
    fieldName: 'evidence_locator_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  evidenceLocatorJson?: unknown;

  @Property({
    fieldName: 'relevance_score',
    columnType: 'numeric',
    nullable: true,
  })
  relevanceScore?: string;

  @Property({
    fieldName: 'evidence_hash',
    columnType: 'varchar',
    nullable: true,
  })
  evidenceHash?: string;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
