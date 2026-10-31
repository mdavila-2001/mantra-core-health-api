import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'observability', tableName: 'slow_request_samples' })
export class SlowRequestSamples {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @PrimaryKey({ columnType: 'timestamptz' })
  time!: Date;

  @Property({ fieldName: 'request_id', columnType: 'varchar' })
  requestId!: string;

  @Property({
    fieldName: 'trace_id',
    columnType: 'varchar(32)',
    nullable: true,
  })
  traceId?: string;

  @Property({ fieldName: 'instance_id', type: 'uuid' })
  instanceId!: string;

  @Property({ fieldName: 'http_method', columnType: 'varchar' })
  httpMethod!: string;

  @Property({ fieldName: 'route_template', columnType: 'varchar' })
  routeTemplate!: string;

  @Property({
    fieldName: 'operation_key',
    columnType: 'varchar',
    nullable: true,
  })
  operationKey?: string;

  @Property({ fieldName: 'module_code', columnType: 'varchar', nullable: true })
  moduleCode?: string;

  @Property({ fieldName: 'http_status', columnType: 'int' })
  httpStatus!: number;

  @Property({ fieldName: 'duration_ms', columnType: 'int' })
  durationMs!: number;

  @Property({ fieldName: 'sql_count', columnType: 'int', nullable: true })
  sqlCount?: number;

  @Property({
    fieldName: 'sql_total_ms',
    columnType: 'double precision',
    nullable: true,
  })
  sqlTotalMs?: number;

  @Property({
    fieldName: 'sql_top_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  sqlTopJson?: unknown;

  @Property({ fieldName: 'sampled_because', columnType: 'varchar' })
  sampledBecause!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
