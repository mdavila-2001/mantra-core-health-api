import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'marketing', tableName: 'marketing_touchpoints' })
export class MarketingTouchpoints {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'campaign_id', type: 'uuid', nullable: true }) // FK → ads.campaigns
  campaignId?: string;

  @Property({ fieldName: 'journey_id', type: 'uuid', nullable: true }) // FK → marketing.journeys
  journeyId?: string;

  @Property({ fieldName: 'tracked_link_id', type: 'uuid', nullable: true }) // FK → marketing.tracked_links
  trackedLinkId?: string;

  @Property({ fieldName: 'member_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  memberTypeConceptId!: string;

  @Property({ fieldName: 'member_ref_id', type: 'uuid' })
  memberRefId!: string;

  @Property({ fieldName: 'touch_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  touchTypeConceptId!: string;

  @Property({ fieldName: 'channel_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  channelConceptId!: string;

  @Property({ fieldName: 'content_template_id', type: 'uuid', nullable: true }) // FK → marketing.content_templates
  contentTemplateId?: string;

  @Property({
    fieldName: 'metadata_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  metadataJson?: unknown;

  @Property({
    fieldName: 'occurred_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  occurredAt?: Date;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;

  @Property({ fieldName: 'dispatch_id', type: 'uuid', nullable: true }) // FK → marketing.campaign_dispatches
  dispatchId?: string;

  @Property({
    fieldName: 'dispatch_recipient_id',
    type: 'uuid',
    nullable: true,
  }) // FK → marketing.campaign_dispatch_recipients
  dispatchRecipientId?: string;

  @Property({
    fieldName: 'notification_request_id',
    type: 'uuid',
    nullable: true,
  }) // FK → messaging.notification_requests
  notificationRequestId?: string;

  @Property({
    fieldName: 'notification_delivery_id',
    type: 'uuid',
    nullable: true,
  }) // FK → messaging.notification_deliveries
  notificationDeliveryId?: string;

  @Property({ fieldName: 'tracking_event_id', type: 'uuid', nullable: true }) // FK → tracking.tracking_events
  trackingEventId?: string;
}
