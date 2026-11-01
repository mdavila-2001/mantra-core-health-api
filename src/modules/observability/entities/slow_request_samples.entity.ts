import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `slow_request_samples`.
 */
@Entity({ schema: 'observability', tableName: 'slow_request_samples' })
export class SlowRequestSamples {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de time mantenido por la instancia.
   */
  @PrimaryKey({ columnType: 'timestamptz' })
  time!: Date;

  /**
   * Identificador asociado a request.
   */
  @Property({ fieldName: 'request_id', columnType: 'varchar' })
  requestId!: string;

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
  @Property({ fieldName: 'instance_id', type: 'uuid' })
  instanceId!: string;

  /**
   * Valor de http method mantenido por la instancia.
   */
  @Property({ fieldName: 'http_method', columnType: 'varchar' })
  httpMethod!: string;

  /**
   * Valor de route template mantenido por la instancia.
   */
  @Property({ fieldName: 'route_template', columnType: 'varchar' })
  routeTemplate!: string;

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
   * Valor de module code mantenido por la instancia.
   */
  @Property({ fieldName: 'module_code', columnType: 'varchar', nullable: true })
  moduleCode?: string;

  /**
   * Valor de http status mantenido por la instancia.
   */
  @Property({ fieldName: 'http_status', columnType: 'int' })
  httpStatus!: number;

  /**
   * Valor de duration ms mantenido por la instancia.
   */
  @Property({ fieldName: 'duration_ms', columnType: 'int' })
  durationMs!: number;

  /**
   * Valor de sql count mantenido por la instancia.
   */
  @Property({ fieldName: 'sql_count', columnType: 'int', nullable: true })
  sqlCount?: number;

  /**
   * Valor de sql total ms mantenido por la instancia.
   */
  @Property({
    fieldName: 'sql_total_ms',
    columnType: 'double precision',
    nullable: true,
  })
  sqlTotalMs?: number;

  /**
   * Valor de sql top json mantenido por la instancia.
   */
  @Property({
    fieldName: 'sql_top_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  sqlTopJson?: unknown;

  /**
   * Valor de sampled because mantenido por la instancia.
   */
  @Property({ fieldName: 'sampled_because', columnType: 'varchar' })
  sampledBecause!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
