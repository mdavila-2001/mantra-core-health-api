import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'cross_store_consistency',
  tableName: 'projection_checkpoints',
})
export class ProjectionCheckpoints {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'projection_subscription_id', type: 'uuid' })
  projectionSubscriptionId!: string;

  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Property({ fieldName: 'partition_key', columnType: 'varchar' })
  partitionKey!: string;

  @Property({ fieldName: 'source_position', columnType: 'varchar' })
  sourcePosition!: string;

  @Property({ fieldName: 'source_event_id', type: 'uuid' })
  sourceEventId!: string;

  @Property({ fieldName: 'target_version', type: 'bigint' })
  targetVersion!: string;

  @Property({ fieldName: 'checkpointed_at', columnType: 'timestamptz' })
  checkpointedAt!: Date;
}
