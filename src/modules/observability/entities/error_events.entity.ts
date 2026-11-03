import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `error_events`.
 */
@Entity({ schema: 'observability', tableName: 'error_events' })
export class ErrorEvents {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de occurred at mantenido por la instancia.
   */
  @PrimaryKey({ fieldName: 'occurred_at', columnType: 'timestamptz' })
  occurredAt!: Date;

  /**
   * Identificador asociado a error group.
   */
  @Property({ fieldName: 'error_group_id', type: 'uuid' }) // FK → observability.error_groups (inferida)
  errorGroupId!: string;

  /**
   * Identificador asociado a request.
   */
  @Property({ fieldName: 'request_id', columnType: 'varchar', nullable: true })
  requestId?: string;

  /**
   * Identificador asociado a trace.
   */
  @Property({
    fieldName: 'trace_id',
    columnType: 'varchar(32)',
    nullable: true,
  })
  traceId?: string;

  /**
   * Identificador asociado a instance.
   */
  @Property({ fieldName: 'instance_id', type: 'uuid' }) // FK → observability.instances (inferida)
  instanceId!: string;

  /**
   * Valor de source mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  source!: string;

  /**
   * Valor de http status mantenido por la instancia.
   */
  @Property({ fieldName: 'http_status', columnType: 'int', nullable: true })
  httpStatus?: number;

  /**
   * Valor de error code mantenido por la instancia.
   */
  @Property({ fieldName: 'error_code', columnType: 'varchar' })
  errorCode!: string;

  /**
   * Valor de error reason mantenido por la instancia.
   */
  @Property({
    fieldName: 'error_reason',
    columnType: 'varchar',
    nullable: true,
  })
  errorReason?: string;

  /**
   * Valor de exception type mantenido por la instancia.
   */
  @Property({
    fieldName: 'exception_type',
    columnType: 'varchar',
    nullable: true,
  })
  exceptionType?: string;

  /**
   * Valor de module code mantenido por la instancia.
   */
  @Property({ fieldName: 'module_code', columnType: 'varchar', nullable: true })
  moduleCode?: string;

  /**
   * Valor de operation key mantenido por la instancia.
   */
  @Property({
    fieldName: 'operation_key',
    columnType: 'varchar',
    nullable: true,
  })
  operationKey?: string;

  /**
   * Valor de http method mantenido por la instancia.
   */
  @Property({ fieldName: 'http_method', columnType: 'varchar', nullable: true })
  httpMethod?: string;

  /**
   * Valor de route template mantenido por la instancia.
   */
  @Property({
    fieldName: 'route_template',
    columnType: 'varchar',
    nullable: true,
  })
  routeTemplate?: string;

  /**
   * Identificador asociado a actor tenant.
   */
  @Property({ fieldName: 'actor_tenant_id', type: 'uuid', nullable: true })
  actorTenantId?: string;

  /**
   * Valor de actor hash mantenido por la instancia.
   */
  @Property({
    fieldName: 'actor_hash',
    columnType: 'varchar(64)',
    nullable: true,
  })
  actorHash?: string;

  /**
   * Valor de duration ms mantenido por la instancia.
   */
  @Property({ fieldName: 'duration_ms', columnType: 'int', nullable: true })
  durationMs?: number;

  /**
   * Valor de sqlstate mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  sqlstate?: string;

  /**
   * Valor de constraint name mantenido por la instancia.
   */
  @Property({
    fieldName: 'constraint_name',
    columnType: 'varchar',
    nullable: true,
  })
  constraintName?: string;

  /**
   * Valor de table name mantenido por la instancia.
   */
  @Property({ fieldName: 'table_name', columnType: 'varchar', nullable: true })
  tableName?: string;

  /**
   * Valor de column name mantenido por la instancia.
   */
  @Property({ fieldName: 'column_name', columnType: 'varchar', nullable: true })
  columnName?: string;

  /**
   * Valor de violations json mantenido por la instancia.
   */
  @Property({
    fieldName: 'violations_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  violationsJson?: unknown;

  /**
   * Valor de message redacted mantenido por la instancia.
   */
  @Property({
    fieldName: 'message_redacted',
    columnType: 'text',
    nullable: true,
  })
  messageRedacted?: string;

  /**
   * Valor de frames json mantenido por la instancia.
   */
  @Property({
    fieldName: 'frames_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  framesJson?: unknown;

  /**
   * Valor de client kind mantenido por la instancia.
   */
  @Property({ fieldName: 'client_kind', columnType: 'varchar', nullable: true })
  clientKind?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
