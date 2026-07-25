import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'messaging', tableName: 'notification_deliveries' })
export class NotificationDeliveries {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'notification_request_id', type: 'uuid' }) // FK → messaging.notification_requests
  notificationRequestId!: string;

  @Property({ fieldName: 'provider_id', type: 'uuid' }) // FK → messaging.messaging_providers
  providerId!: string;

  @Property({ fieldName: 'channel_id', type: 'uuid' }) // FK → messaging.message_channels
  channelId!: string;

  @Property({ fieldName: 'attempt_number', columnType: 'int' })
  attemptNumber!: number;

  @Property({
    fieldName: 'provider_message_ref',
    columnType: 'varchar',
    nullable: true,
  })
  providerMessageRef?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'error_code', columnType: 'varchar', nullable: true })
  errorCode?: string;

  @Property({ fieldName: 'error_text', columnType: 'text', nullable: true })
  errorText?: string;

  @Property({ fieldName: 'cost_amount', columnType: 'numeric', nullable: true })
  costAmount?: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  @Property({ fieldName: 'sent_at', columnType: 'timestamptz', nullable: true })
  sentAt?: Date;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;

  @Property({ fieldName: 'provider_channel_config_id', type: 'uuid' }) // FK → messaging.provider_channel_configs
  providerChannelConfigId!: string;

  @Property({ fieldName: 'adapter_code', columnType: 'varchar' })
  adapterCode!: string;

  @Property({ fieldName: 'adapter_version', columnType: 'varchar' })
  adapterVersion!: string;

  @Property({
    fieldName: 'started_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startedAt?: Date;

  @Property({
    fieldName: 'accepted_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  acceptedAt?: Date;

  @Property({
    fieldName: 'delivered_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  deliveredAt?: Date;

  @Property({ fieldName: 'seen_at', columnType: 'timestamptz', nullable: true })
  seenAt?: Date;

  @Property({ fieldName: 'read_at', columnType: 'timestamptz', nullable: true })
  readAt?: Date;

  @Property({
    fieldName: 'clicked_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  clickedAt?: Date;

  @Property({
    fieldName: 'replied_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  repliedAt?: Date;

  @Property({
    fieldName: 'bounced_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  bouncedAt?: Date;

  @Property({
    fieldName: 'failed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  failedAt?: Date;

  @Property({
    fieldName: 'cancelled_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  cancelledAt?: Date;

  @Property({
    fieldName: 'expired_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  expiredAt?: Date;

  @Property({
    fieldName: 'terminal_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  terminalAt?: Date;

  @Property({
    fieldName: 'last_event_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastEventAt?: Date;

  @Property({ fieldName: 'last_event_id', type: 'uuid', nullable: true }) // FK → messaging.delivery_tracking_events
  lastEventId?: string;

  @Property({
    fieldName: 'provider_status_raw',
    columnType: 'varchar',
    nullable: true,
  })
  providerStatusRaw?: string;

  @Property({
    fieldName: 'provider_response_hash',
    columnType: 'varchar',
    nullable: true,
  })
  providerResponseHash?: string;
}
