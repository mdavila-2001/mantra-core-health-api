import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `context_fact_evidence`.
 */
@Entity({ schema: 'health_context', tableName: 'context_fact_evidence' })
export class ContextFactEvidence {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a health context fact.
   */
  @Property({ fieldName: 'health_context_fact_id', type: 'uuid' }) // FK → health_context.health_context_facts
  healthContextFactId!: string;

  /**
   * Identificador asociado a source observation.
   */
  @Property({ fieldName: 'source_observation_id', type: 'uuid' }) // FK → clinical.observations
  sourceObservationId!: string;

  /**
   * Valor de evidence locator json mantenido por la instancia.
   */
  @Property({
    fieldName: 'evidence_locator_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  evidenceLocatorJson?: unknown;

  /**
   * Valor de relevance score mantenido por la instancia.
   */
  @Property({
    fieldName: 'relevance_score',
    columnType: 'numeric',
    nullable: true,
  })
  relevanceScore?: string;

  /**
   * Valor de evidence hash mantenido por la instancia.
   */
  @Property({
    fieldName: 'evidence_hash',
    columnType: 'varchar',
    nullable: true,
  })
  evidenceHash?: string;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  /**
   * Identificador asociado a recorded by user.
   */
  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
