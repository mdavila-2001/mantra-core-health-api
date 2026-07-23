import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'integrations', tableName: 'message_retries' })
export class MessageRetries {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'outbound_message_id', type: 'uuid' }) // FK → integrations.outbound_messages
  outboundMessageId!: string;

  @Property({ fieldName: 'attempt_number', columnType: 'int' })
  attemptNumber!: number;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'error_text', columnType: 'text', nullable: true })
  errorText?: string;

  @Property({
    fieldName: 'request_snapshot_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  requestSnapshotJson?: unknown;

  @Property({ fieldName: 'payload_version', columnType: 'int' })
  payloadVersion!: number;

  @Property({
    fieldName: 'attempted_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  attemptedAt?: Date;

  @Property({
    fieldName: 'next_retry_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  nextRetryAt?: Date;

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
