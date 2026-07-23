import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'ad_review_events' })
export class AdReviewEvents {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'ad_id', type: 'uuid' }) // FK → ads.ads
  adId!: string;

  @Property({ fieldName: 'occurred_at', columnType: 'timestamptz' })
  occurredAt!: Date;

  @Property({ fieldName: 'review_event_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  reviewEventTypeConceptId!: string;

  @Property({ fieldName: 'review_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  reviewStatusConceptId!: string;

  @Property({
    fieldName: 'external_review_id',
    columnType: 'varchar',
    nullable: true,
  })
  externalReviewId?: string;

  @Property({
    fieldName: 'reasons_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  reasonsJson?: unknown;

  @Property({
    fieldName: 'source_payload_hash',
    columnType: 'varchar',
    nullable: true,
  })
  sourcePayloadHash?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
