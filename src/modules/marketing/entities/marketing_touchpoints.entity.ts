import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `marketing_touchpoints`.
 */
@Entity({ schema: 'marketing', tableName: 'marketing_touchpoints' })
export class MarketingTouchpoints {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a campaign.
   */
  @Property({ fieldName: 'campaign_id', type: 'uuid', nullable: true }) // FK → ads.campaigns
  campaignId?: string;

  /**
   * Identificador asociado a journey.
   */
  @Property({ fieldName: 'journey_id', type: 'uuid', nullable: true }) // FK → marketing.journeys
  journeyId?: string;

  /**
   * Identificador asociado a tracked link.
   */
  @Property({ fieldName: 'tracked_link_id', type: 'uuid', nullable: true }) // FK → marketing.tracked_links
  trackedLinkId?: string;

  /**
   * Identificador asociado a member type concept.
   */
  @Property({ fieldName: 'member_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  memberTypeConceptId!: string;

  /**
   * Identificador asociado a member ref.
   */
  @Property({ fieldName: 'member_ref_id', type: 'uuid' })
  memberRefId!: string;

  /**
   * Identificador asociado a touch type concept.
   */
  @Property({ fieldName: 'touch_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  touchTypeConceptId!: string;

  /**
   * Identificador asociado a channel concept.
   */
  @Property({ fieldName: 'channel_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  channelConceptId!: string;

  /**
   * Identificador asociado a content template.
   */
  @Property({ fieldName: 'content_template_id', type: 'uuid', nullable: true }) // FK → marketing.content_templates
  contentTemplateId?: string;

  /**
   * Valor de metadata json mantenido por la instancia.
   */
  @Property({
    fieldName: 'metadata_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  metadataJson?: unknown;

  /**
   * Valor de occurred at mantenido por la instancia.
   */
  @Property({
    fieldName: 'occurred_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  occurredAt?: Date;

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

  /**
   * Identificador asociado a dispatch.
   */
  @Property({ fieldName: 'dispatch_id', type: 'uuid', nullable: true }) // FK → marketing.campaign_dispatches
  dispatchId?: string;

  /**
   * Identificador asociado a dispatch recipient.
   */
  @Property({
    fieldName: 'dispatch_recipient_id',
    type: 'uuid',
    nullable: true,
  }) // FK → marketing.campaign_dispatch_recipients
  dispatchRecipientId?: string;

  /**
   * Identificador asociado a notification request.
   */
  @Property({
    fieldName: 'notification_request_id',
    type: 'uuid',
    nullable: true,
  }) // FK → messaging.notification_requests
  notificationRequestId?: string;

  /**
   * Identificador asociado a notification delivery.
   */
  @Property({
    fieldName: 'notification_delivery_id',
    type: 'uuid',
    nullable: true,
  }) // FK → messaging.notification_deliveries
  notificationDeliveryId?: string;

  /**
   * Identificador asociado a tracking event.
   */
  @Property({ fieldName: 'tracking_event_id', type: 'uuid', nullable: true }) // FK → tracking.tracking_events
  trackingEventId?: string;
}
