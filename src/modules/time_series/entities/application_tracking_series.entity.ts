import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

/**
 * Mapea la entidad persistente asociada a `application_tracking_series`.
 */
@Entity({ schema: 'time_series', tableName: 'application_tracking_series' })
export class ApplicationTrackingSeries {
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
   * Valor de application code mantenido por la instancia.
   */
  @Property({ fieldName: 'application_code', columnType: 'varchar' })
  applicationCode!: string;

  /**
   * Identificador asociado a user.
   */
  @Property({ fieldName: 'user_id', type: 'uuid' })
  userId!: string;

  /**
   * Valor de event name mantenido por la instancia.
   */
  @Property({ fieldName: 'event_name', columnType: 'varchar' })
  eventName!: string;

  /**
   * Valor de screen code mantenido por la instancia.
   */
  @Property({ fieldName: 'screen_code', columnType: 'varchar', nullable: true })
  screenCode?: string;

  /**
   * Identificador asociado a campaign.
   */
  @Property({ fieldName: 'campaign_id', type: 'uuid', nullable: true })
  campaignId?: string;

  /**
   * Valor de properties mantenido por la instancia.
   */
  @Property({ type: 'json', columnType: 'jsonb', nullable: true })
  properties?: unknown;
}
