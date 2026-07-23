import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'cross_store_consistency',
  tableName: 'projection_repair_jobs',
})
export class ProjectionRepairJobs {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Property({ fieldName: 'projection_drift_event_id', type: 'uuid' })
  projectionDriftEventId!: string;

  @Property({ fieldName: 'repair_action', columnType: 'varchar' })
  repairAction!: string;

  @Property({ fieldName: 'idempotency_key', columnType: 'varchar' })
  idempotencyKey!: string;

  @Property({ columnType: 'varchar' })
  status!: string;

  @Property({ fieldName: 'requested_at', columnType: 'timestamptz' })
  requestedAt!: Date;

  @Property({ fieldName: 'completed_at', columnType: 'timestamptz' })
  completedAt!: Date;
}
