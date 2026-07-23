import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'conversion_attributions' })
export class ConversionAttributions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'pixel_event_id', type: 'uuid' }) // FK → ads.pixel_events
  pixelEventId!: string;

  @Property({ fieldName: 'ad_ref_id', type: 'uuid', nullable: true })
  adRefId?: string;

  @Property({ fieldName: 'campaign_ref_id', type: 'uuid', nullable: true })
  campaignRefId?: string;

  @Property({ fieldName: 'attribution_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  attributionTypeConceptId!: string;

  @Property({
    fieldName: 'attributed_value',
    columnType: 'numeric',
    nullable: true,
  })
  attributedValue?: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  @Property({
    fieldName: 'attributed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  attributedAt?: Date;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
