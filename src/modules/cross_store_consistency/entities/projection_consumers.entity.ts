import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'cross_store_consistency',
  tableName: 'projection_consumers',
})
export class ProjectionConsumers {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ fieldName: 'service_name', columnType: 'varchar' })
  serviceName!: string;

  @Property({ fieldName: 'deployment_region', columnType: 'varchar' })
  deploymentRegion!: string;

  @Property({ fieldName: 'consumer_group', columnType: 'varchar' })
  consumerGroup!: string;

  @Property({ fieldName: 'heartbeat_at', columnType: 'timestamptz' })
  heartbeatAt!: Date;

  @Property({ columnType: 'varchar' })
  state!: string;
}
