import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity({ schema: 'time_series', tableName: 'application_tracking_series' })
export class ApplicationTrackingSeries {
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

  @Property({ fieldName: 'application_code', columnType: 'varchar' })
  applicationCode!: string;

  @Property({ fieldName: 'user_id', type: 'uuid' })
  userId!: string;

  @Property({ fieldName: 'event_name', columnType: 'varchar' })
  eventName!: string;

  @Property({ fieldName: 'screen_code', columnType: 'varchar', nullable: true })
  screenCode?: string;

  @Property({ fieldName: 'campaign_id', type: 'uuid', nullable: true })
  campaignId?: string;

  @Property({ type: 'json', columnType: 'jsonb', nullable: true })
  properties?: unknown;
}
