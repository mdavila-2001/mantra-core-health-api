import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `insights_campaign_daily_facts`.
 */
@Entity({ schema: 'marketing', tableName: 'insights_campaign_daily_facts' })
export class InsightsCampaignDailyFacts {
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
   * Identificador asociado a campaign.
   */
  @Property({ fieldName: 'campaign_id', type: 'uuid' }) // FK → ads.campaigns (inferida)
  campaignId!: string;

  /**
   * Valor de channel code mantenido por la instancia.
   */
  @Property({ fieldName: 'channel_code', columnType: 'varchar' })
  channelCode!: string;

  /**
   * Identificador asociado a creative.
   */
  @Property({ fieldName: 'creative_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  creativeId?: string;

  /**
   * Valor de impressions mantenido por la instancia.
   */
  @Property({ type: 'bigint', nullable: true })
  impressions?: string;

  /**
   * Valor de reach mantenido por la instancia.
   */
  @Property({ type: 'bigint', nullable: true })
  reach?: string;

  /**
   * Valor de engagements mantenido por la instancia.
   */
  @Property({ type: 'bigint', nullable: true })
  engagements?: string;

  /**
   * Valor de clicks mantenido por la instancia.
   */
  @Property({ type: 'bigint', nullable: true })
  clicks?: string;

  /**
   * Valor de video views mantenido por la instancia.
   */
  @Property({ fieldName: 'video_views', type: 'bigint', nullable: true })
  videoViews?: string;

  /**
   * Valor de watch seconds mantenido por la instancia.
   */
  @Property({ fieldName: 'watch_seconds', type: 'bigint', nullable: true })
  watchSeconds?: string;

  /**
   * Valor de visits mantenido por la instancia.
   */
  @Property({ type: 'bigint', nullable: true })
  visits?: string;

  /**
   * Valor de leads mantenido por la instancia.
   */
  @Property({ type: 'bigint', nullable: true })
  leads?: string;

  /**
   * Valor de registrations mantenido por la instancia.
   */
  @Property({ type: 'bigint', nullable: true })
  registrations?: string;

  /**
   * Valor de activations mantenido por la instancia.
   */
  @Property({ type: 'bigint', nullable: true })
  activations?: string;

  /**
   * Valor de first uses mantenido por la instancia.
   */
  @Property({ fieldName: 'first_uses', type: 'bigint', nullable: true })
  firstUses?: string;

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
   * Valor de revenue cents mantenido por la instancia.
   */
  @Property({ fieldName: 'revenue_cents', type: 'bigint', nullable: true })
  revenueCents?: string;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;
}
