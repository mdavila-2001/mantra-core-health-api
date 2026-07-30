import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

/**
 * Mapea la entidad persistente asociada a `telemetry_event_series`.
 */
@Entity({ schema: 'time_series', tableName: 'telemetry_event_series' })
export class TelemetryEventSeries {
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
   * Identificador asociado a user.
   */
  @Property({ fieldName: 'user_id', type: 'uuid' })
  userId!: string;

  /**
   * Valor de event code mantenido por la instancia.
   */
  @Property({ fieldName: 'event_code', columnType: 'varchar' })
  eventCode!: string;

  /**
   * Identificador asociado a session.
   */
  @Property({ fieldName: 'session_id', type: 'uuid' })
  sessionId!: string;

  /**
   * Valor de application code mantenido por la instancia.
   */
  @Property({ fieldName: 'application_code', columnType: 'varchar' })
  applicationCode!: string;

  /**
   * Valor de duration ms mantenido por la instancia.
   */
  @Property({ fieldName: 'duration_ms', columnType: 'int' })
  durationMs!: number;

  /**
   * Valor de properties mantenido por la instancia.
   */
  @Property({ type: 'json', columnType: 'jsonb', nullable: true })
  properties?: unknown;
}
