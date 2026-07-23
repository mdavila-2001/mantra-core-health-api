import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'messaging', tableName: 'outbox_messages' })
export class OutboxMessages {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  @Property({ fieldName: 'domain_event_id', type: 'uuid' }) // FK → messaging.domain_events
  domainEventId!: string;

  @Property({ fieldName: 'aggregate_type', columnType: 'varchar' })
  aggregateType!: string;

  @Property({ fieldName: 'aggregate_id', type: 'uuid' })
  aggregateId!: string;

  @Property({ fieldName: 'idempotency_key', columnType: 'varchar' })
  idempotencyKey!: string;

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
    fieldName: 'published_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  publishedAt?: Date;

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
