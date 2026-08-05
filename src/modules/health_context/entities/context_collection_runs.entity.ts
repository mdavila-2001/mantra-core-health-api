import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `context_collection_runs`.
 */
@Entity({ schema: 'health_context', tableName: 'context_collection_runs' })
export class ContextCollectionRuns {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a schedule.
   */
  @Property({ fieldName: 'schedule_id', type: 'uuid', nullable: true }) // FK → health_context.country_context_schedules
  scheduleId?: string;

  /**
   * Identificador asociado a agent.
   */
  @Property({ fieldName: 'agent_id', type: 'uuid' }) // FK → automation.agents
  agentId!: string;

  /**
   * Identificador asociado a country concept.
   */
  @Property({ fieldName: 'country_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  countryConceptId!: string;

  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  @Property({ fieldName: 'idempotency_key', columnType: 'varchar' })
  idempotencyKey!: string;

  /**
   * Identificador asociado a trigger concept.
   */
  @Property({ fieldName: 'trigger_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  triggerConceptId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de started at mantenido por la instancia.
   */
  @Property({ fieldName: 'started_at', columnType: 'timestamptz' })
  startedAt!: Date;

  /**
   * Valor de finished at mantenido por la instancia.
   */
  @Property({
    fieldName: 'finished_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  finishedAt?: Date;

  /**
   * Valor de source count mantenido por la instancia.
   */
  @Property({ fieldName: 'source_count', columnType: 'int', nullable: true })
  sourceCount?: number;

  /**
   * Valor de observations read mantenido por la instancia.
   */
  @Property({ fieldName: 'observations_read', type: 'bigint', nullable: true })
  observationsRead?: string;

  /**
   * Valor de observations accepted mantenido por la instancia.
   */
  @Property({
    fieldName: 'observations_accepted',
    type: 'bigint',
    nullable: true,
  })
  observationsAccepted?: string;

  /**
   * Valor de observations rejected mantenido por la instancia.
   */
  @Property({
    fieldName: 'observations_rejected',
    type: 'bigint',
    nullable: true,
  })
  observationsRejected?: string;

  /**
   * Valor de continuation cursor json mantenido por la instancia.
   */
  @Property({
    fieldName: 'continuation_cursor_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  continuationCursorJson?: unknown;

  /**
   * Valor de error summary mantenido por la instancia.
   */
  @Property({ fieldName: 'error_summary', columnType: 'text', nullable: true })
  errorSummary?: string;

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
