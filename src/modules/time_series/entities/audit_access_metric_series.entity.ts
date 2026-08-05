import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

/**
 * Mapea la entidad persistente asociada a `audit_access_metric_series`.
 */
@Entity({ schema: 'time_series', tableName: 'audit_access_metric_series' })
export class AuditAccessMetricSeries {
  /**
   * Valor de time mantenido por la instancia.
   */
  @PrimaryKey({ columnType: 'timestamptz' })
  time!: Date;

  /**
   * Identificador asociado a tenant.
   */
  @PrimaryKey({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  /**
   * Identificador asociado a series.
   */
  @PrimaryKey({ fieldName: 'series_id', columnType: 'varchar' })
  seriesId!: string;

  /**
   * Identificador asociado a ingestion.
   */
  @Property({ fieldName: 'ingestion_id', type: 'uuid' })
  ingestionId!: string;

  /**
   * Valor de source version mantenido por la instancia.
   */
  @Property({ fieldName: 'source_version', columnType: 'varchar' })
  sourceVersion!: string;

  /**
   * Valor de quality state mantenido por la instancia.
   */
  @Property({ fieldName: 'quality_state', columnType: 'varchar' })
  qualityState!: string;

  /**
   * Valor de actor type mantenido por la instancia.
   */
  @Property({ fieldName: 'actor_type', columnType: 'varchar' })
  actorType!: string;

  /**
   * Identificador asociado a actor.
   */
  @Property({ fieldName: 'actor_id', type: 'uuid' })
  actorId!: string;

  /**
   * Valor de action code mantenido por la instancia.
   */
  @Property({ fieldName: 'action_code', columnType: 'varchar' })
  actionCode!: string;

  /**
   * Valor de target type mantenido por la instancia.
   */
  @Property({ fieldName: 'target_type', columnType: 'varchar' })
  targetType!: string;

  /**
   * Valor de outcome mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  outcome!: string;

  /**
   * Valor de count mantenido por la instancia.
   */
  @Property({ columnType: 'bigint' })
  count!: string;

  /**
   * Valor de dimensions mantenido por la instancia.
   */
  @Property({ type: 'json', columnType: 'jsonb', nullable: true })
  dimensions?: unknown;
}
