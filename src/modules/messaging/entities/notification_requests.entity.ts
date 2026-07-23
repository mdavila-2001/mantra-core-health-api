import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'messaging', tableName: 'notification_requests' })
export class NotificationRequests {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  @Property({ fieldName: 'recipient_user_id', type: 'uuid' }) // FK → iam.users
  recipientUserId!: string;

  @Property({
    fieldName: 'recipient_address',
    columnType: 'varchar',
    nullable: true,
  })
  recipientAddress?: string;

  @Property({ fieldName: 'channel_id', type: 'uuid' }) // FK (destino no resuelto)
  channelId!: string;

  @Property({ fieldName: 'template_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  templateId?: string;

  @Property({ fieldName: 'domain_event_id', type: 'uuid', nullable: true }) // FK → messaging.domain_events
  domainEventId?: string;

  @Property({
    fieldName: 'payload_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  payloadJson?: unknown;

  @Property({
    fieldName: 'debounce_key',
    columnType: 'varchar',
    nullable: true,
  })
  debounceKey?: string;

  @Property({ columnType: 'int' })
  priority!: number;

  @Property({ fieldName: 'category_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  categoryConceptId?: string;

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

  @Property({ fieldName: 'consent_id', type: 'uuid', nullable: true }) // FK → consent.consents
  consentId?: string;

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

  @Property({ fieldName: 'dispatch_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  dispatchId?: string;

  @Property({
    fieldName: 'dispatch_recipient_id',
    type: 'uuid',
    nullable: true,
  }) // FK (destino no resuelto)
  dispatchRecipientId?: string;

  @Property({ fieldName: 'recipient_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  recipientTypeConceptId!: string;

  @Property({ fieldName: 'recipient_ref_id', type: 'uuid' })
  recipientRefId!: string;

  @Property({
    fieldName: 'recipient_endpoint_id',
    type: 'uuid',
    nullable: true,
  }) // FK (destino no resuelto)
  recipientEndpointId?: string;

  @Property({ fieldName: 'source_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  sourceConceptId!: string;

  @Property({ fieldName: 'authorized_by_user_id', type: 'uuid' }) // FK → iam.users
  authorizedByUserId!: string;

  @Property({
    fieldName: 'authorization_snapshot_json',
    type: 'json',
    columnType: 'jsonb',
  })
  authorizationSnapshotJson!: unknown;

  @Property({
    fieldName: 'content_snapshot_json',
    type: 'json',
    columnType: 'jsonb',
  })
  contentSnapshotJson!: unknown;

  @Property({ fieldName: 'content_hash', columnType: 'varchar' })
  contentHash!: string;

  @Property({ fieldName: 'idempotency_key', columnType: 'varchar' })
  idempotencyKey!: string;

  @Property({
    fieldName: 'expires_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  expiresAt?: Date;

  @Property({
    fieldName: 'cancellation_requested_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  cancellationRequestedAt?: Date;

  @Property({
    fieldName: 'cancelled_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  cancelledAt?: Date;
}
