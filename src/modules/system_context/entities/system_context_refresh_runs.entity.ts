import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'system_context', tableName: 'system_context_refresh_runs' })
export class SystemContextRefreshRuns {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'system_context_id', type: 'uuid' }) // FK → system_context.system_contexts
  systemContextId!: string;

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

  @Property({ fieldName: 'input_count', columnType: 'int', nullable: true })
  inputCount?: number;

  @Property({
    fieldName: 'output_content_hash',
    columnType: 'varchar',
    nullable: true,
  })
  outputContentHash?: string;

  @Property({ fieldName: 'error_summary', columnType: 'text', nullable: true })
  errorSummary?: string;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
