import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `in_app_notifications`.
 */
@Entity({ schema: 'messaging', tableName: 'in_app_notifications' })
export class InAppNotifications {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a recipient user.
   */
  @Property({ fieldName: 'recipient_user_id', type: 'uuid' }) // FK → iam.users
  recipientUserId!: string;

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  /**
   * Identificador asociado a channel concept.
   */
  @Property({ fieldName: 'channel_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  channelConceptId!: string;

  /**
   * Identificador asociado a category concept.
   */
  @Property({ fieldName: 'category_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  categoryConceptId?: string;

  /**
   * Valor de template code mantenido por la instancia.
   */
  @Property({
    fieldName: 'template_code',
    columnType: 'varchar',
    nullable: true,
  })
  templateCode?: string;

  /**
   * Valor de subject mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  subject?: string;

  /**
   * Valor de body text mantenido por la instancia.
   */
  @Property({ fieldName: 'body_text', columnType: 'text', nullable: true })
  bodyText?: string;

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
   * Valor de sent at mantenido por la instancia.
   */
  @Property({ fieldName: 'sent_at', columnType: 'timestamptz', nullable: true })
  sentAt?: Date;

  /**
   * Valor de read at mantenido por la instancia.
   */
  @Property({ fieldName: 'read_at', columnType: 'timestamptz', nullable: true })
  readAt?: Date;

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
   * Identificador asociado a notification request.
   */
  @Property({ fieldName: 'notification_request_id', type: 'uuid' }) // FK → messaging.notification_requests
  notificationRequestId!: string;

  /**
   * Identificador asociado a notification delivery.
   */
  @Property({ fieldName: 'notification_delivery_id', type: 'uuid' }) // FK → messaging.notification_deliveries
  notificationDeliveryId!: string;

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
   * Valor de available at mantenido por la instancia.
   */
  @Property({ fieldName: 'available_at', columnType: 'timestamptz' })
  availableAt!: Date;

  /**
   * Valor de first seen at mantenido por la instancia.
   */
  @Property({
    fieldName: 'first_seen_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  firstSeenAt?: Date;

  /**
   * Valor de last seen at mantenido por la instancia.
   */
  @Property({
    fieldName: 'last_seen_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastSeenAt?: Date;

  /**
   * Valor de opened at mantenido por la instancia.
   */
  @Property({
    fieldName: 'opened_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  openedAt?: Date;

  /**
   * Valor de dismissed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'dismissed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  dismissedAt?: Date;

  /**
   * Valor de archived at mantenido por la instancia.
   */
  @Property({
    fieldName: 'archived_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  archivedAt?: Date;

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
   * Valor de action state json mantenido por la instancia.
   */
  @Property({
    fieldName: 'action_state_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  actionStateJson?: unknown;
}
