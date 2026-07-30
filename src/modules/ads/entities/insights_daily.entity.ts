import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `insights_daily`.
 */
@Entity({ schema: 'ads', tableName: 'insights_daily' })
export class InsightsDaily {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a ad account.
   */
  @Property({ fieldName: 'ad_account_id', type: 'uuid' }) // FK → ads.ad_accounts
  adAccountId!: string;

  /**
   * Identificador asociado a entity type concept.
   */
  @Property({ fieldName: 'entity_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  entityTypeConceptId!: string;

  /**
   * Identificador asociado a entity ref.
   */
  @Property({ fieldName: 'entity_ref_id', type: 'uuid' })
  entityRefId!: string;

  /**
   * Valor de stat date mantenido por la instancia.
   */
  @Property({ fieldName: 'stat_date', columnType: 'date' })
  statDate!: Date;

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
   * Valor de clicks mantenido por la instancia.
   */
  @Property({ type: 'bigint', nullable: true })
  clicks?: string;

  /**
   * Valor de unique clicks mantenido por la instancia.
   */
  @Property({ fieldName: 'unique_clicks', type: 'bigint', nullable: true })
  uniqueClicks?: string;

  /**
   * Valor de spend mantenido por la instancia.
   */
  @Property({ columnType: 'numeric', nullable: true })
  spend?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  /**
   * Valor de conversions mantenido por la instancia.
   */
  @Property({ type: 'bigint', nullable: true })
  conversions?: string;

  /**
   * Valor de conversion value mantenido por la instancia.
   */
  @Property({
    fieldName: 'conversion_value',
    columnType: 'numeric',
    nullable: true,
  })
  conversionValue?: string;

  /**
   * Valor de ctr mantenido por la instancia.
   */
  @Property({ columnType: 'numeric', nullable: true })
  ctr?: string;

  /**
   * Valor de cpc mantenido por la instancia.
   */
  @Property({ columnType: 'numeric', nullable: true })
  cpc?: string;

  /**
   * Valor de cpm mantenido por la instancia.
   */
  @Property({ columnType: 'numeric', nullable: true })
  cpm?: string;

  /**
   * Valor de frequency mantenido por la instancia.
   */
  @Property({ columnType: 'numeric', nullable: true })
  frequency?: string;

  /**
   * Valor de video views mantenido por la instancia.
   */
  @Property({ fieldName: 'video_views', type: 'bigint', nullable: true })
  videoViews?: string;

  /**
   * Valor de breakdown json mantenido por la instancia.
   */
  @Property({
    fieldName: 'breakdown_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  breakdownJson?: unknown;

  /**
   * Identificador asociado a source concept.
   */
  @Property({ fieldName: 'source_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  sourceConceptId?: string;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  /**
   * Identificador asociado a recorded by user.
   */
  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
