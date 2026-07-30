import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `notification_requests`.
 */
@Entity({ schema: 'messaging', tableName: 'notification_requests' })
export class NotificationRequests {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  /**
   * Identificador asociado a recipient user.
   */
  @Property({ fieldName: 'recipient_user_id', type: 'uuid' }) // FK → iam.users
  recipientUserId!: string;

  /**
   * Valor de recipient address mantenido por la instancia.
   */
  @Property({
    fieldName: 'recipient_address',
    columnType: 'varchar',
    nullable: true,
  })
  recipientAddress?: string;

  /**
   * Identificador asociado a channel.
   */
  @Property({ fieldName: 'channel_id', type: 'uuid' }) // FK → messaging.message_channels
  channelId!: string;

  /**
   * Identificador asociado a template.
   */
  @Property({ fieldName: 'template_id', type: 'uuid', nullable: true }) // FK → messaging.message_templates
  templateId?: string;

  /**
   * Identificador asociado a domain event.
   */
  @Property({ fieldName: 'domain_event_id', type: 'uuid', nullable: true }) // FK → messaging.domain_events
  domainEventId?: string;

  /**
   * Valor de payload json mantenido por la instancia.
   */
  @Property({
    fieldName: 'payload_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  payloadJson?: unknown;

  /**
   * Valor de debounce key mantenido por la instancia.
   */
  @Property({
    fieldName: 'debounce_key',
    columnType: 'varchar',
    nullable: true,
  })
  debounceKey?: string;

  /**
   * Valor de priority mantenido por la instancia.
   */
  @Property({ columnType: 'int' })
  priority!: number;

  /**
   * Identificador asociado a category concept.
   */
  @Property({ fieldName: 'category_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  categoryConceptId?: string;

  /**
   * Valor de related resource type mantenido por la instancia.
   */
  @Property({
    fieldName: 'related_resource_type',
    columnType: 'varchar',
    nullable: true,
  })
  relatedResourceType?: string;

  /**
   * Identificador asociado a related resource.
   */
  @Property({ fieldName: 'related_resource_id', type: 'uuid', nullable: true })
  relatedResourceId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de scheduled at mantenido por la instancia.
   */
  @Property({
    fieldName: 'scheduled_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  scheduledAt?: Date;

  /**
   * Identificador asociado a consent.
   */
  @Property({ fieldName: 'consent_id', type: 'uuid', nullable: true }) // FK → consent.consents
  consentId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;

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
   * Identificador asociado a recipient type concept.
   */
  @Property({ fieldName: 'recipient_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  recipientTypeConceptId!: string;

  /**
   * Identificador asociado a recipient ref.
   */
  @Property({ fieldName: 'recipient_ref_id', type: 'uuid' })
  recipientRefId!: string;

  /**
   * Identificador asociado a recipient endpoint.
   */
  @Property({
    fieldName: 'recipient_endpoint_id',
    type: 'uuid',
    nullable: true,
  }) // FK → crm.contact_channel_endpoints
  recipientEndpointId?: string;

  /**
   * Identificador asociado a source concept.
   */
  @Property({ fieldName: 'source_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  sourceConceptId!: string;

  /**
   * Identificador asociado a authorized by user.
   */
  @Property({ fieldName: 'authorized_by_user_id', type: 'uuid' }) // FK → iam.users
  authorizedByUserId!: string;

  /**
   * Valor de authorization snapshot json mantenido por la instancia.
   */
  @Property({
    fieldName: 'authorization_snapshot_json',
    type: 'json',
    columnType: 'jsonb',
  })
  authorizationSnapshotJson!: unknown;

  /**
   * Valor de content snapshot json mantenido por la instancia.
   */
  @Property({
    fieldName: 'content_snapshot_json',
    type: 'json',
    columnType: 'jsonb',
  })
  contentSnapshotJson!: unknown;

  /**
   * Valor de content hash mantenido por la instancia.
   */
  @Property({ fieldName: 'content_hash', columnType: 'varchar' })
  contentHash!: string;

  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  @Property({ fieldName: 'idempotency_key', columnType: 'varchar' })
  idempotencyKey!: string;

  /**
   * Valor de expires at mantenido por la instancia.
   */
  @Property({
    fieldName: 'expires_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  expiresAt?: Date;

  /**
   * Valor de cancellation requested at mantenido por la instancia.
   */
  @Property({
    fieldName: 'cancellation_requested_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  cancellationRequestedAt?: Date;

  /**
   * Valor de cancelled at mantenido por la instancia.
   */
  @Property({
    fieldName: 'cancelled_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  cancelledAt?: Date;
}
