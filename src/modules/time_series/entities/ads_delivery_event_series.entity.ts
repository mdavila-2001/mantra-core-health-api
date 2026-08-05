import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

/**
 * Mapea la entidad persistente asociada a `ads_delivery_event_series`.
 */
@Entity({ schema: 'time_series', tableName: 'ads_delivery_event_series' })
export class AdsDeliveryEventSeries {
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
   * Identificador asociado a ad account.
   */
  @Property({ fieldName: 'ad_account_id', type: 'uuid' })
  adAccountId!: string;

  /**
   * Identificador asociado a campaign.
   */
  @Property({ fieldName: 'campaign_id', type: 'uuid' })
  campaignId!: string;

  /**
   * Identificador asociado a ad set.
   */
  @Property({ fieldName: 'ad_set_id', type: 'uuid', nullable: true })
  adSetId?: string;

  /**
   * Identificador asociado a ad.
   */
  @Property({ fieldName: 'ad_id', type: 'uuid', nullable: true })
  adId?: string;

  /**
   * Valor de event name mantenido por la instancia.
   */
  @Property({ fieldName: 'event_name', columnType: 'varchar' })
  eventName!: string;

  /**
   * Identificador asociado a event.
   */
  @Property({ fieldName: 'event_id', columnType: 'varchar' })
  eventId!: string;

  /**
   * Valor de value mantenido por la instancia.
   */
  @Property({ columnType: 'double precision', nullable: true })
  value?: number;

  /**
   * Valor de currency code mantenido por la instancia.
   */
  @Property({
    fieldName: 'currency_code',
    columnType: 'char(3)',
    nullable: true,
  })
  currencyCode?: string;

  /**
   * Valor de dimensions mantenido por la instancia.
   */
  @Property({ type: 'json', columnType: 'jsonb', nullable: true })
  dimensions?: unknown;
}
