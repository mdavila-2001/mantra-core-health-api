import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity({ schema: 'observability', tableName: 'http_request_minute_series' })
export class HttpRequestMinuteSeries {
  @PrimaryKey({ columnType: 'timestamptz' })
  time!: Date;

  @PrimaryKey({ fieldName: 'instance_id', type: 'uuid' })
  instanceId!: string;

  @PrimaryKey({ fieldName: 'flush_seq', columnType: 'int' })
  flushSeq!: number;

  @PrimaryKey({ fieldName: 'http_method', columnType: 'varchar' })
  httpMethod!: string;

  @PrimaryKey({ fieldName: 'route_template', columnType: 'varchar' })
  routeTemplate!: string;

  @PrimaryKey({ fieldName: 'http_status', columnType: 'int' })
  httpStatus!: number;

  @Property({
    fieldName: 'operation_key',
    columnType: 'varchar',
    nullable: true,
  })
  operationKey?: string;

  @Property({ fieldName: 'module_code', columnType: 'varchar', nullable: true })
  moduleCode?: string;

  @Property({ columnType: 'int' })
  requests!: number;

  @Property({ fieldName: 'sum_ms', columnType: 'double precision' })
  sumMs!: number;

  @Property({ fieldName: 'max_ms', columnType: 'double precision' })
  maxMs!: number;

  @Property({ columnType: 'int' })
  le5!: number;

  @Property({ columnType: 'int' })
  le10!: number;

  @Property({ columnType: 'int' })
  le25!: number;

  @Property({ columnType: 'int' })
  le50!: number;

  @Property({ columnType: 'int' })
  le100!: number;

  @Property({ columnType: 'int' })
  le250!: number;

  @Property({ columnType: 'int' })
  le500!: number;

  @Property({ columnType: 'int' })
  le1000!: number;

  @Property({ columnType: 'int' })
  le2000!: number;

  @Property({ columnType: 'int' })
  le5000!: number;

  @Property({ columnType: 'int' })
  le10000!: number;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
