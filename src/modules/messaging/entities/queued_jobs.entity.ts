import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'messaging', tableName: 'queued_jobs' })
export class QueuedJobs {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'queue_id', type: 'uuid' }) // FK (destino no resuelto)
  queueId!: string;

  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  @Property({ fieldName: 'job_type', columnType: 'varchar' })
  jobType!: string;

  @Property({ fieldName: 'dedupe_key', columnType: 'varchar', nullable: true })
  dedupeKey?: string;

  @Property({ columnType: 'int' })
  priority!: number;

  @Property({ fieldName: 'payload_json', type: 'json', columnType: 'jsonb' })
  payloadJson!: unknown;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'available_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  availableAt?: Date;

  @Property({
    fieldName: 'started_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startedAt?: Date;

  @Property({
    fieldName: 'completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  completedAt?: Date;

  @Property({ columnType: 'int' })
  attempts!: number;

  @Property({ fieldName: 'max_attempts', columnType: 'int' })
  maxAttempts!: number;

  @Property({ fieldName: 'locked_by', columnType: 'varchar', nullable: true })
  lockedBy?: string;

  @Property({
    fieldName: 'lock_expires_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lockExpiresAt?: Date;

  @Property({
    fieldName: 'last_error_text',
    columnType: 'text',
    nullable: true,
  })
  lastErrorText?: string;

  @Property({
    fieldName: 'result_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  resultJson?: unknown;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
