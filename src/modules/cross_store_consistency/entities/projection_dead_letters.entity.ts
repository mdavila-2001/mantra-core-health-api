import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'cross_store_consistency',
  tableName: 'projection_dead_letters',
})
export class ProjectionDeadLetters {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'projection_delivery_attempt_id', type: 'uuid' })
  projectionDeliveryAttemptId!: string;

  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Property({ fieldName: 'reason_code', columnType: 'varchar' })
  reasonCode!: string;

  @Property({ fieldName: 'payload_object_id', type: 'uuid' })
  payloadObjectId!: string;

  @Property({ columnType: 'varchar' })
  state!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'resolved_at', columnType: 'timestamptz' })
  resolvedAt!: Date;
}
