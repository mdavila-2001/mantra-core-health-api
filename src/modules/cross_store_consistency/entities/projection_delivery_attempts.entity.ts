import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'cross_store_consistency',
  tableName: 'projection_delivery_attempts',
})
export class ProjectionDeliveryAttempts {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'projection_subscription_id', type: 'uuid' })
  projectionSubscriptionId!: string;

  @Property({ fieldName: 'outbox_event_id', type: 'uuid' })
  outboxEventId!: string;

  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Property({ fieldName: 'attempt_number', columnType: 'int' })
  attemptNumber!: number;

  @Property({ fieldName: 'idempotency_key', columnType: 'varchar' })
  idempotencyKey!: string;

  @Property({ fieldName: 'payload_hash', columnType: 'varchar' })
  payloadHash!: string;

  @Property({ columnType: 'varchar' })
  status!: string;

  @Property({ fieldName: 'started_at', columnType: 'timestamptz' })
  startedAt!: Date;

  @Property({ fieldName: 'completed_at', columnType: 'timestamptz' })
  completedAt!: Date;

  @Property({ fieldName: 'error_code', columnType: 'varchar', nullable: true })
  errorCode?: string;
}
