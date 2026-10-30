import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `insights_social_daily_facts`.
 */
@Entity({ schema: 'marketing', tableName: 'insights_social_daily_facts' })
export class InsightsSocialDailyFacts {
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
   * Valor de platform code mantenido por la instancia.
   */
  @Property({ fieldName: 'platform_code', columnType: 'varchar' })
  platformCode!: string;

  /**
   * Valor de followers mantenido por la instancia.
   */
  @Property({ type: 'bigint', nullable: true })
  followers?: string;

  /**
   * Valor de new followers mantenido por la instancia.
   */
  @Property({ fieldName: 'new_followers', type: 'bigint', nullable: true })
  newFollowers?: string;

  /**
   * Valor de reach mantenido por la instancia.
   */
  @Property({ type: 'bigint', nullable: true })
  reach?: string;

  /**
   * Valor de impressions mantenido por la instancia.
   */
  @Property({ type: 'bigint', nullable: true })
  impressions?: string;

  /**
   * Valor de engagements mantenido por la instancia.
   */
  @Property({ type: 'bigint', nullable: true })
  engagements?: string;

  /**
   * Valor de saves mantenido por la instancia.
   */
  @Property({ type: 'bigint', nullable: true })
  saves?: string;

  /**
   * Valor de shares mantenido por la instancia.
   */
  @Property({ type: 'bigint', nullable: true })
  shares?: string;

  /**
   * Valor de comments mantenido por la instancia.
   */
  @Property({ type: 'bigint', nullable: true })
  comments?: string;

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
   * Valor de completions mantenido por la instancia.
   */
  @Property({ type: 'bigint', nullable: true })
  completions?: string;

  /**
   * Valor de viewed pct numerator mantenido por la instancia.
   */
  @Property({
    fieldName: 'viewed_pct_numerator',
    columnType: 'numeric(18,4)',
    nullable: true,
  })
  viewedPctNumerator?: string;

  /**
   * Valor de viewed pct denominator mantenido por la instancia.
   */
  @Property({
    fieldName: 'viewed_pct_denominator',
    type: 'bigint',
    nullable: true,
  })
  viewedPctDenominator?: string;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;
}
