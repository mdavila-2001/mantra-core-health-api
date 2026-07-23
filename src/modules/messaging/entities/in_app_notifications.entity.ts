import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'messaging', tableName: 'in_app_notifications' })
export class InAppNotifications {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'recipient_user_id', type: 'uuid' }) // FK → iam.users
  recipientUserId!: string;

  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  @Property({ fieldName: 'channel_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  channelConceptId!: string;

  @Property({ fieldName: 'category_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  categoryConceptId?: string;

  @Property({
    fieldName: 'template_code',
    columnType: 'varchar',
    nullable: true,
  })
  templateCode?: string;

  @Property({ columnType: 'varchar', nullable: true })
  subject?: string;

  @Property({ fieldName: 'body_text', columnType: 'text', nullable: true })
  bodyText?: string;

  @Property({
    fieldName: 'payload_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  payloadJson?: unknown;

  @Property({
    fieldName: 'related_resource_type',
    columnType: 'varchar',
    nullable: true,
  })
  relatedResourceType?: string;

  @Property({ fieldName: 'related_resource_id', type: 'uuid', nullable: true })
  relatedResourceId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'scheduled_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  scheduledAt?: Date;

  @Property({ fieldName: 'sent_at', columnType: 'timestamptz', nullable: true })
  sentAt?: Date;

  @Property({ fieldName: 'read_at', columnType: 'timestamptz', nullable: true })
  readAt?: Date;

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

  @Property({ fieldName: 'notification_request_id', type: 'uuid' }) // FK → messaging.notification_requests
  notificationRequestId!: string;

  @Property({ fieldName: 'notification_delivery_id', type: 'uuid' }) // FK → messaging.notification_deliveries
  notificationDeliveryId!: string;

  @Property({
    fieldName: 'dispatch_recipient_id',
    type: 'uuid',
    nullable: true,
  }) // FK (destino no resuelto)
  dispatchRecipientId?: string;

  @Property({ fieldName: 'available_at', columnType: 'timestamptz' })
  availableAt!: Date;

  @Property({
    fieldName: 'first_seen_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  firstSeenAt?: Date;

  @Property({
    fieldName: 'last_seen_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastSeenAt?: Date;

  @Property({
    fieldName: 'opened_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  openedAt?: Date;

  @Property({
    fieldName: 'dismissed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  dismissedAt?: Date;

  @Property({
    fieldName: 'archived_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  archivedAt?: Date;

  @Property({
    fieldName: 'expires_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  expiresAt?: Date;

  @Property({
    fieldName: 'action_state_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  actionStateJson?: unknown;
}
