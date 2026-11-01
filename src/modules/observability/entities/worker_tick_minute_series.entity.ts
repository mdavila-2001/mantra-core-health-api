import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

/**
 * Mapea la entidad persistente asociada a `worker_tick_minute_series`.
 */
@Entity({ schema: 'observability', tableName: 'worker_tick_minute_series' })
export class WorkerTickMinuteSeries {
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
   * Valor de operation mantenido por la instancia.
   */
  @PrimaryKey({ columnType: 'varchar' })
  operation!: string;

  /**
   * Valor de worker name mantenido por la instancia.
   */
  @Property({ fieldName: 'worker_name', columnType: 'varchar' })
  workerName!: string;

  /**
   * Valor de runs mantenido por la instancia.
   */
  @Property({ columnType: 'int' })
  runs!: number;

  /**
   * Valor de failures mantenido por la instancia.
   */
  @Property({ columnType: 'int' })
  failures!: number;

  /**
   * Valor de timeouts mantenido por la instancia.
   */
  @Property({ columnType: 'int' })
  timeouts!: number;

  /**
   * Valor de skipped mantenido por la instancia.
   */
  @Property({ columnType: 'int' })
  skipped!: number;

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
   * Valor de consecutive failures max mantenido por la instancia.
   */
  @Property({ fieldName: 'consecutive_failures_max', columnType: 'int' })
  consecutiveFailuresMax!: number;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
