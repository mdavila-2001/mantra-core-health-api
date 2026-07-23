import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'offline_conversion_events' })
export class OfflineConversionEvents {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'offline_conversion_set_id', type: 'uuid' }) // FK → ads.offline_conversion_sets
  offlineConversionSetId!: string;

  @Property({ fieldName: 'event_name', columnType: 'varchar' })
  eventName!: string;

  @Property({
    fieldName: 'event_time',
    columnType: 'timestamptz',
    nullable: true,
  })
  eventTime?: Date;

  @Property({
    fieldName: 'match_keys_hash_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  matchKeysHashJson?: unknown;

  @Property({
    fieldName: 'value_amount',
    columnType: 'numeric',
    nullable: true,
  })
  valueAmount?: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  @Property({ fieldName: 'order_ref', columnType: 'varchar', nullable: true })
  orderRef?: string;

  @Property({ fieldName: 'is_matched', type: 'boolean', nullable: true })
  isMatched?: boolean;

  @Property({
    fieldName: 'attributed_campaign_ref_id',
    type: 'uuid',
    nullable: true,
  })
  attributedCampaignRefId?: string;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
