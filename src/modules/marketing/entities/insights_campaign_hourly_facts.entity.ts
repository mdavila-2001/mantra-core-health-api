import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `insights_campaign_hourly_facts`.
 */
@Entity({ schema: 'marketing', tableName: 'insights_campaign_hourly_facts' })
export class InsightsCampaignHourlyFacts {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de fact date mantenido por la instancia.
   */
  @Property({ fieldName: 'fact_date', columnType: 'date' })
  factDate!: Date;

  /**
   * Valor de hour mantenido por la instancia.
   */
  @Property({ columnType: 'smallint' })
  hour!: number;

  /**
   * Identificador asociado a campaign.
   */
  @Property({ fieldName: 'campaign_id', type: 'uuid' }) // FK → marketing.insights_campaigns
  campaignId!: string;

  /**
   * Valor de channel code mantenido por la instancia.
   */
  @Property({ fieldName: 'channel_code', columnType: 'varchar' })
  channelCode!: string;

  /**
   * Valor de impressions mantenido por la instancia.
   */
  @Property({ type: 'bigint', nullable: true })
  impressions?: string;

  /**
   * Valor de clicks mantenido por la instancia.
   */
  @Property({ type: 'bigint', nullable: true })
  clicks?: string;

  /**
   * Valor de registrations mantenido por la instancia.
   */
  @Property({ type: 'bigint', nullable: true })
  registrations?: string;

  /**
   * Valor de conversions mantenido por la instancia.
   */
  @Property({ type: 'bigint', nullable: true })
  conversions?: string;

  /**
   * Valor de spend cents mantenido por la instancia.
   */
  @Property({ fieldName: 'spend_cents', type: 'bigint', nullable: true })
  spendCents?: string;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;
}
