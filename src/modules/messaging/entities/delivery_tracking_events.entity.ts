import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'messaging', tableName: 'delivery_tracking_events' })
export class DeliveryTrackingEvents {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'delivery_id', type: 'uuid' }) // FK → messaging.notification_deliveries
  deliveryId!: string;

  @Property({ fieldName: 'notification_request_id', type: 'uuid' }) // FK → messaging.notification_requests
  notificationRequestId!: string;

  @Property({ fieldName: 'dispatch_id', type: 'uuid', nullable: true }) // FK → marketing.campaign_dispatches
  dispatchId?: string;

  @Property({
    fieldName: 'dispatch_recipient_id',
    type: 'uuid',
    nullable: true,
  }) // FK → marketing.campaign_dispatch_recipients
  dispatchRecipientId?: string;

  @Property({ fieldName: 'inbound_event_id', type: 'uuid', nullable: true }) // FK → messaging.adapter_inbound_events
  inboundEventId?: string;

  @Property({ fieldName: 'canonical_event_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  canonicalEventTypeConceptId!: string;

  @Property({ fieldName: 'resulting_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  resultingStatusConceptId!: string;

  @Property({ fieldName: 'source_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  sourceConceptId!: string;

  @Property({
    fieldName: 'provider_event_code',
    columnType: 'varchar',
    nullable: true,
  })
  providerEventCode?: string;

  @Property({
    fieldName: 'provider_event_id',
    columnType: 'varchar',
    nullable: true,
  })
  providerEventId?: string;

  @Property({
    fieldName: 'provider_message_ref',
    columnType: 'varchar',
    nullable: true,
  })
  providerMessageRef?: string;

  @Property({ fieldName: 'sequence_number', type: 'bigint', nullable: true })
  sequenceNumber?: string;

  @Property({ fieldName: 'occurred_at', columnType: 'timestamptz' })
  occurredAt!: Date;

  @Property({ fieldName: 'received_at', columnType: 'timestamptz' })
  receivedAt!: Date;

  @Property({ fieldName: 'effective_at', columnType: 'timestamptz' })
  effectiveAt!: Date;

  @Property({ columnType: 'int' })
  precedence!: number;

  @Property({ fieldName: 'is_terminal', type: 'boolean' })
  isTerminal!: boolean;

  @Property({ fieldName: 'is_success', type: 'boolean', nullable: true })
  isSuccess?: boolean;

  @Property({ fieldName: 'is_late', type: 'boolean' })
  isLate!: boolean;

  @Property({ fieldName: 'is_duplicate', type: 'boolean' })
  isDuplicate!: boolean;

  @Property({
    fieldName: 'metadata_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  metadataJson?: unknown;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
