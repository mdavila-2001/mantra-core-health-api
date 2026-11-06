import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

/**
 * Mapea la entidad persistente asociada a `http_request_minute_series`.
 */
@Entity({ schema: 'observability', tableName: 'http_request_minute_series' })
export class HttpRequestMinuteSeries {
  /**
   * Valor de time mantenido por la instancia.
   */
  @PrimaryKey({ columnType: 'timestamptz' })
  time!: Date;

  /**
   * Identificador asociado a instance.
   */
  @PrimaryKey({ fieldName: 'instance_id', type: 'uuid' })
  instanceId!: string;

  /**
   * Valor de flush seq mantenido por la instancia.
   */
  @PrimaryKey({ fieldName: 'flush_seq', columnType: 'int' })
  flushSeq!: number;

  /**
   * Valor de http method mantenido por la instancia.
   */
  @PrimaryKey({ fieldName: 'http_method', columnType: 'varchar' })
  httpMethod!: string;

  /**
   * Valor de route template mantenido por la instancia.
   */
  @PrimaryKey({ fieldName: 'route_template', columnType: 'varchar' })
  routeTemplate!: string;

  /**
   * Valor de http status mantenido por la instancia.
   */
  @PrimaryKey({ fieldName: 'http_status', columnType: 'int' })
  httpStatus!: number;

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
   * Valor de requests mantenido por la instancia.
   */
  @Property({ columnType: 'int' })
  requests!: number;

  /**
   * Valor de sum ms mantenido por la instancia.
   */
  @Property({ fieldName: 'sum_ms', columnType: 'double precision' })
  sumMs!: number;

  /**
   * Valor de max ms mantenido por la instancia.
   */
  @Property({ fieldName: 'max_ms', columnType: 'double precision' })
  maxMs!: number;

  /**
   * Valor de le5 mantenido por la instancia.
   */
  @Property({ columnType: 'int' })
  le5!: number;

  /**
   * Valor de le10 mantenido por la instancia.
   */
  @Property({ columnType: 'int' })
  le10!: number;

  /**
   * Valor de le25 mantenido por la instancia.
   */
  @Property({ columnType: 'int' })
  le25!: number;

  /**
   * Valor de le50 mantenido por la instancia.
   */
  @Property({ columnType: 'int' })
  le50!: number;

  /**
   * Valor de le100 mantenido por la instancia.
   */
  @Property({ columnType: 'int' })
  le100!: number;

  /**
   * Valor de le250 mantenido por la instancia.
   */
  @Property({ columnType: 'int' })
  le250!: number;

  /**
   * Valor de le500 mantenido por la instancia.
   */
  @Property({ columnType: 'int' })
  le500!: number;

  /**
   * Valor de le1000 mantenido por la instancia.
   */
  @Property({ columnType: 'int' })
  le1000!: number;

  /**
   * Valor de le2000 mantenido por la instancia.
   */
  @Property({ columnType: 'int' })
  le2000!: number;

  /**
   * Valor de le5000 mantenido por la instancia.
   */
  @Property({ columnType: 'int' })
  le5000!: number;

  /**
   * Valor de le10000 mantenido por la instancia.
   */
  @Property({ columnType: 'int' })
  le10000!: number;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
