import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity({ schema: 'observability', tableName: 'sql_statement_minute_series' })
export class SqlStatementMinuteSeries {
  @PrimaryKey({ columnType: 'timestamptz' })
  time!: Date;

  @PrimaryKey({ fieldName: 'instance_id', type: 'uuid' })
  instanceId!: string;

  @PrimaryKey({ fieldName: 'flush_seq', columnType: 'int' })
  flushSeq!: number;

  @PrimaryKey({ fieldName: 'query_hash', columnType: 'varchar(12)' })
  queryHash!: string;

  @PrimaryKey({ fieldName: 'operation_key', columnType: 'varchar' })
  operationKey!: string;

  @Property({ fieldName: 'module_code', columnType: 'varchar', nullable: true })
  moduleCode?: string;

  @Property({ columnType: 'int' })
  executions!: number;

  @Property({ fieldName: 'sum_ms', columnType: 'double precision' })
  sumMs!: number;

  @Property({ fieldName: 'max_ms', columnType: 'double precision' })
  maxMs!: number;

  @Property({ fieldName: 'slow_count', columnType: 'int' })
  slowCount!: number;

  @Property({ fieldName: 'failed_count', columnType: 'int' })
  failedCount!: number;

  @Property({ fieldName: 'rows_sum', type: 'bigint' })
  rowsSum!: string;

  @Property({ columnType: 'int' })
  le1!: number;

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
  le5000!: number;

  @Property({ columnType: 'int' })
  inf!: number;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
