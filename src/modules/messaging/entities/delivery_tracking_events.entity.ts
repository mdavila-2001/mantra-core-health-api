import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `delivery_tracking_events`.
 */
@Entity({ schema: 'messaging', tableName: 'delivery_tracking_events' })
export class DeliveryTrackingEvents {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a delivery.
   */
  @Property({ fieldName: 'delivery_id', type: 'uuid' }) // FK → messaging.notification_deliveries
  deliveryId!: string;

  /**
   * Identificador asociado a notification request.
   */
  @Property({ fieldName: 'notification_request_id', type: 'uuid' }) // FK → messaging.notification_requests
  notificationRequestId!: string;

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
   * Identificador asociado a inbound event.
   */
  @Property({ fieldName: 'inbound_event_id', type: 'uuid', nullable: true }) // FK → messaging.adapter_inbound_events
  inboundEventId?: string;

  /**
   * Identificador asociado a canonical event type concept.
   */
  @Property({ fieldName: 'canonical_event_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  canonicalEventTypeConceptId!: string;

  /**
   * Identificador asociado a resulting status concept.
   */
  @Property({ fieldName: 'resulting_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  resultingStatusConceptId!: string;

  /**
   * Identificador asociado a source concept.
   */
  @Property({ fieldName: 'source_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  sourceConceptId!: string;

  /**
   * Valor de provider event code mantenido por la instancia.
   */
  @Property({
    fieldName: 'provider_event_code',
    columnType: 'varchar',
    nullable: true,
  })
  providerEventCode?: string;

  /**
   * Identificador asociado a provider event.
   */
  @Property({
    fieldName: 'provider_event_id',
    columnType: 'varchar',
    nullable: true,
  })
  providerEventId?: string;

  /**
   * Valor de provider message ref mantenido por la instancia.
   */
  @Property({
    fieldName: 'provider_message_ref',
    columnType: 'varchar',
    nullable: true,
  })
  providerMessageRef?: string;

  /**
   * Valor de sequence number mantenido por la instancia.
   */
  @Property({ fieldName: 'sequence_number', type: 'bigint', nullable: true })
  sequenceNumber?: string;

  /**
   * Valor de occurred at mantenido por la instancia.
   */
  @Property({ fieldName: 'occurred_at', columnType: 'timestamptz' })
  occurredAt!: Date;

  /**
   * Valor de received at mantenido por la instancia.
   */
  @Property({ fieldName: 'received_at', columnType: 'timestamptz' })
  receivedAt!: Date;

  /**
   * Valor de effective at mantenido por la instancia.
   */
  @Property({ fieldName: 'effective_at', columnType: 'timestamptz' })
  effectiveAt!: Date;

  /**
   * Valor de precedence mantenido por la instancia.
   */
  @Property({ columnType: 'int' })
  precedence!: number;

  /**
   * Valor de is terminal mantenido por la instancia.
   */
  @Property({ fieldName: 'is_terminal', type: 'boolean' })
  isTerminal!: boolean;

  /**
   * Valor de is success mantenido por la instancia.
   */
  @Property({ fieldName: 'is_success', type: 'boolean', nullable: true })
  isSuccess?: boolean;

  /**
   * Valor de is late mantenido por la instancia.
   */
  @Property({ fieldName: 'is_late', type: 'boolean' })
  isLate!: boolean;

  /**
   * Valor de is duplicate mantenido por la instancia.
   */
  @Property({ fieldName: 'is_duplicate', type: 'boolean' })
  isDuplicate!: boolean;

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
