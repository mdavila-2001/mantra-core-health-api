import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity({ schema: 'time_series', tableName: 'telemetry_event_series' })
export class TelemetryEventSeries {
  @PrimaryKey({ columnType: 'timestamptz' })
  time!: Date;

  @PrimaryKey({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @PrimaryKey({ fieldName: 'series_id', columnType: 'varchar' })
  seriesId!: string;

  @Property({ fieldName: 'ingestion_id', type: 'uuid' })
  ingestionId!: string;

  @Property({ fieldName: 'source_version', columnType: 'varchar' })
  sourceVersion!: string;

  @Property({ fieldName: 'quality_state', columnType: 'varchar' })
  qualityState!: string;

  @Property({ fieldName: 'user_id', type: 'uuid' })
  userId!: string;

  @Property({ fieldName: 'event_code', columnType: 'varchar' })
  eventCode!: string;

  @Property({ fieldName: 'session_id', type: 'uuid' })
  sessionId!: string;

  @Property({ fieldName: 'application_code', columnType: 'varchar' })
  applicationCode!: string;

  @Property({ fieldName: 'duration_ms', columnType: 'int' })
  durationMs!: number;

  @Property({ type: 'json', columnType: 'jsonb', nullable: true })
  properties?: unknown;
}
