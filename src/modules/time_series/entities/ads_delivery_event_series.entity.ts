import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity({ schema: 'time_series', tableName: 'ads_delivery_event_series' })
export class AdsDeliveryEventSeries {
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

  @Property({ fieldName: 'ad_account_id', type: 'uuid' })
  adAccountId!: string;

  @Property({ fieldName: 'campaign_id', type: 'uuid' })
  campaignId!: string;

  @Property({ fieldName: 'ad_set_id', type: 'uuid', nullable: true })
  adSetId?: string;

  @Property({ fieldName: 'ad_id', type: 'uuid', nullable: true })
  adId?: string;

  @Property({ fieldName: 'event_name', columnType: 'varchar' })
  eventName!: string;

  @Property({ fieldName: 'event_id', columnType: 'varchar' })
  eventId!: string;

  @Property({ columnType: 'double precision', nullable: true })
  value?: number;

  @Property({
    fieldName: 'currency_code',
    columnType: 'char(3)',
    nullable: true,
  })
  currencyCode?: string;

  @Property({ type: 'json', columnType: 'jsonb', nullable: true })
  dimensions?: unknown;
}
