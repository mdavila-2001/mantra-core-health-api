import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

/**
 * Mapea la entidad persistente asociada a `rollup_watermarks`.
 */
@Entity({ schema: 'observability', tableName: 'rollup_watermarks' })
export class RollupWatermarks {
  /**
   * Valor de rollup name mantenido por la instancia.
   */
  @PrimaryKey({ fieldName: 'rollup_name', columnType: 'varchar' })
  rollupName!: string;

  /**
   * Valor de materialized until mantenido por la instancia.
   */
  @Property({ fieldName: 'materialized_until', columnType: 'timestamptz' })
  materializedUntil!: Date;

  /**
   * Valor de last run at mantenido por la instancia.
   */
  @Property({
    fieldName: 'last_run_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastRunAt?: Date;

  /**
   * Valor de last duration ms mantenido por la instancia.
   */
  @Property({
    fieldName: 'last_duration_ms',
    columnType: 'int',
    nullable: true,
  })
  lastDurationMs?: number;

  /**
   * Valor de last error mantenido por la instancia.
   */
  @Property({ fieldName: 'last_error', columnType: 'varchar', nullable: true })
  lastError?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
