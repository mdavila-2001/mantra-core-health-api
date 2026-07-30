import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `offline_conversion_events`.
 */
@Entity({ schema: 'ads', tableName: 'offline_conversion_events' })
export class OfflineConversionEvents {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a offline conversion set.
   */
  @Property({ fieldName: 'offline_conversion_set_id', type: 'uuid' }) // FK → ads.offline_conversion_sets
  offlineConversionSetId!: string;

  /**
   * Valor de event name mantenido por la instancia.
   */
  @Property({ fieldName: 'event_name', columnType: 'varchar' })
  eventName!: string;

  /**
   * Valor de event time mantenido por la instancia.
   */
  @Property({
    fieldName: 'event_time',
    columnType: 'timestamptz',
    nullable: true,
  })
  eventTime?: Date;

  /**
   * Valor de match keys hash json mantenido por la instancia.
   */
  @Property({
    fieldName: 'match_keys_hash_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  matchKeysHashJson?: unknown;

  /**
   * Valor de value amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'value_amount',
    columnType: 'numeric',
    nullable: true,
  })
  valueAmount?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  /**
   * Valor de order ref mantenido por la instancia.
   */
  @Property({ fieldName: 'order_ref', columnType: 'varchar', nullable: true })
  orderRef?: string;

  /**
   * Valor de is matched mantenido por la instancia.
   */
  @Property({ fieldName: 'is_matched', type: 'boolean', nullable: true })
  isMatched?: boolean;

  /**
   * Identificador asociado a attributed campaign ref.
   */
  @Property({
    fieldName: 'attributed_campaign_ref_id',
    type: 'uuid',
    nullable: true,
  })
  attributedCampaignRefId?: string;

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
