import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'messaging', tableName: 'dead_letter_jobs' })
export class DeadLetterJobs {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'queue_id', type: 'uuid' }) // FK → messaging.message_queues
  queueId!: string;

  @Property({ fieldName: 'original_job_id', type: 'uuid' }) // FK → messaging.queued_jobs
  originalJobId!: string;

  @Property({ fieldName: 'failure_reason_text', columnType: 'text' })
  failureReasonText!: string;

  @Property({ fieldName: 'payload_json', type: 'json', columnType: 'jsonb' })
  payloadJson!: unknown;

  @Property({ columnType: 'int' })
  attempts!: number;

  @Property({
    fieldName: 'failed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  failedAt?: Date;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
