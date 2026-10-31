import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity({ schema: 'observability', tableName: 'worker_tick_minute_series' })
export class WorkerTickMinuteSeries {
  @PrimaryKey({ columnType: 'timestamptz' })
  time!: Date;

  @PrimaryKey({ fieldName: 'instance_id', type: 'uuid' })
  instanceId!: string;

  @PrimaryKey({ columnType: 'varchar' })
  operation!: string;

  @Property({ fieldName: 'worker_name', columnType: 'varchar' })
  workerName!: string;

  @Property({ columnType: 'int' })
  runs!: number;

  @Property({ columnType: 'int' })
  failures!: number;

  @Property({ columnType: 'int' })
  timeouts!: number;

  @Property({ columnType: 'int' })
  skipped!: number;

  @Property({ fieldName: 'sum_ms', columnType: 'double precision' })
  sumMs!: number;

  @Property({ fieldName: 'max_ms', columnType: 'double precision' })
  maxMs!: number;

  @Property({ fieldName: 'consecutive_failures_max', columnType: 'int' })
  consecutiveFailuresMax!: number;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
