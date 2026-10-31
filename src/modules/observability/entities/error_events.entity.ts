import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'observability', tableName: 'error_events' })
export class ErrorEvents {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @PrimaryKey({ fieldName: 'occurred_at', columnType: 'timestamptz' })
  occurredAt!: Date;

  @Property({ fieldName: 'error_group_id', type: 'uuid' }) // FK → observability.error_groups (inferida)
  errorGroupId!: string;

  @Property({ fieldName: 'request_id', columnType: 'varchar', nullable: true })
  requestId?: string;

  @Property({
    fieldName: 'trace_id',
    columnType: 'varchar(32)',
    nullable: true,
  })
  traceId?: string;

  @Property({ fieldName: 'instance_id', type: 'uuid' }) // FK → observability.instances (inferida)
  instanceId!: string;

  @Property({ columnType: 'varchar' })
  source!: string;

  @Property({ fieldName: 'http_status', columnType: 'int', nullable: true })
  httpStatus?: number;

  @Property({ fieldName: 'error_code', columnType: 'varchar' })
  errorCode!: string;

  @Property({
    fieldName: 'error_reason',
    columnType: 'varchar',
    nullable: true,
  })
  errorReason?: string;

  @Property({
    fieldName: 'exception_type',
    columnType: 'varchar',
    nullable: true,
  })
  exceptionType?: string;

  @Property({ fieldName: 'module_code', columnType: 'varchar', nullable: true })
  moduleCode?: string;

  @Property({
    fieldName: 'operation_key',
    columnType: 'varchar',
    nullable: true,
  })
  operationKey?: string;

  @Property({ fieldName: 'http_method', columnType: 'varchar', nullable: true })
  httpMethod?: string;

  @Property({
    fieldName: 'route_template',
    columnType: 'varchar',
    nullable: true,
  })
  routeTemplate?: string;

  @Property({ fieldName: 'actor_tenant_id', type: 'uuid', nullable: true })
  actorTenantId?: string;

  @Property({
    fieldName: 'actor_hash',
    columnType: 'varchar(64)',
    nullable: true,
  })
  actorHash?: string;

  @Property({ fieldName: 'duration_ms', columnType: 'int', nullable: true })
  durationMs?: number;

  @Property({ columnType: 'varchar', nullable: true })
  sqlstate?: string;

  @Property({
    fieldName: 'constraint_name',
    columnType: 'varchar',
    nullable: true,
  })
  constraintName?: string;

  @Property({ fieldName: 'table_name', columnType: 'varchar', nullable: true })
  tableName?: string;

  @Property({ fieldName: 'column_name', columnType: 'varchar', nullable: true })
  columnName?: string;

  @Property({
    fieldName: 'violations_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  violationsJson?: unknown;

  @Property({
    fieldName: 'message_redacted',
    columnType: 'text',
    nullable: true,
  })
  messageRedacted?: string;

  @Property({
    fieldName: 'frames_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  framesJson?: unknown;

  @Property({ fieldName: 'client_kind', columnType: 'varchar', nullable: true })
  clientKind?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
