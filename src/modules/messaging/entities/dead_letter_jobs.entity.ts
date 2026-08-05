import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `dead_letter_jobs`.
 */
@Entity({ schema: 'messaging', tableName: 'dead_letter_jobs' })
export class DeadLetterJobs {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a queue.
   */
  @Property({ fieldName: 'queue_id', type: 'uuid' }) // FK → messaging.message_queues
  queueId!: string;

  /**
   * Identificador asociado a original job.
   */
  @Property({ fieldName: 'original_job_id', type: 'uuid' }) // FK → messaging.queued_jobs
  originalJobId!: string;

  /**
   * Valor de failure reason text mantenido por la instancia.
   */
  @Property({ fieldName: 'failure_reason_text', columnType: 'text' })
  failureReasonText!: string;

  /**
   * Valor de payload json mantenido por la instancia.
   */
  @Property({ fieldName: 'payload_json', type: 'json', columnType: 'jsonb' })
  payloadJson!: unknown;

  /**
   * Valor de attempts mantenido por la instancia.
   */
  @Property({ columnType: 'int' })
  attempts!: number;

  /**
   * Valor de failed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'failed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  failedAt?: Date;

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
