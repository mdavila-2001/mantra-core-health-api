import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'health_context', tableName: 'context_collection_runs' })
export class ContextCollectionRuns {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'schedule_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  scheduleId?: string;

  @Property({ fieldName: 'agent_id', type: 'uuid' }) // FK → automation.agents
  agentId!: string;

  @Property({ fieldName: 'country_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  countryConceptId!: string;

  @Property({ fieldName: 'idempotency_key', columnType: 'varchar' })
  idempotencyKey!: string;

  @Property({ fieldName: 'trigger_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  triggerConceptId!: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'started_at', columnType: 'timestamptz' })
  startedAt!: Date;

  @Property({
    fieldName: 'finished_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  finishedAt?: Date;

  @Property({ fieldName: 'source_count', columnType: 'int', nullable: true })
  sourceCount?: number;

  @Property({ fieldName: 'observations_read', type: 'bigint', nullable: true })
  observationsRead?: string;

  @Property({
    fieldName: 'observations_accepted',
    type: 'bigint',
    nullable: true,
  })
  observationsAccepted?: string;

  @Property({
    fieldName: 'observations_rejected',
    type: 'bigint',
    nullable: true,
  })
  observationsRejected?: string;

  @Property({
    fieldName: 'continuation_cursor_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  continuationCursorJson?: unknown;

  @Property({ fieldName: 'error_summary', columnType: 'text', nullable: true })
  errorSummary?: string;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
