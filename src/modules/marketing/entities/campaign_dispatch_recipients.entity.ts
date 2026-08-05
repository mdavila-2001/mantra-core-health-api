import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `campaign_dispatch_recipients`.
 */
@Entity({ schema: 'marketing', tableName: 'campaign_dispatch_recipients' })
export class CampaignDispatchRecipients {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a dispatch.
   */
  @Property({ fieldName: 'dispatch_id', type: 'uuid' }) // FK → marketing.campaign_dispatches
  dispatchId!: string;

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
   * Identificador asociado a recipient endpoint.
   */
  @Property({
    fieldName: 'recipient_endpoint_id',
    type: 'uuid',
    nullable: true,
  }) // FK → crm.contact_channel_endpoints
  recipientEndpointId?: string;

  /**
   * Identificador asociado a recipient user.
   */
  @Property({ fieldName: 'recipient_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recipientUserId?: string;

  /**
   * Identificador asociado a channel.
   */
  @Property({ fieldName: 'channel_id', type: 'uuid' }) // FK → messaging.message_channels
  channelId!: string;

  /**
   * Identificador asociado a language concept.
   */
  @Property({ fieldName: 'language_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  languageConceptId?: string;

  /**
   * Valor de timezone name mantenido por la instancia.
   */
  @Property({
    fieldName: 'timezone_name',
    columnType: 'varchar',
    nullable: true,
  })
  timezoneName?: string;

  /**
   * Identificador asociado a consent.
   */
  @Property({ fieldName: 'consent_id', type: 'uuid', nullable: true }) // FK → consent.consents
  consentId?: string;

  /**
   * Identificador asociado a consent status concept.
   */
  @Property({ fieldName: 'consent_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  consentStatusConceptId!: string;

  /**
   * Valor de preference snapshot json mantenido por la instancia.
   */
  @Property({
    fieldName: 'preference_snapshot_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  preferenceSnapshotJson?: unknown;

  /**
   * Identificador asociado a eligibility status concept.
   */
  @Property({ fieldName: 'eligibility_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  eligibilityStatusConceptId!: string;

  /**
   * Identificador asociado a suppression reason concept.
   */
  @Property({
    fieldName: 'suppression_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  suppressionReasonConceptId?: string;

  /**
   * Valor de suppression detail mantenido por la instancia.
   */
  @Property({
    fieldName: 'suppression_detail',
    columnType: 'varchar',
    nullable: true,
  })
  suppressionDetail?: string;

  /**
   * Valor de scheduled at mantenido por la instancia.
   */
  @Property({ fieldName: 'scheduled_at', columnType: 'timestamptz' })
  scheduledAt!: Date;

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
   * Identificador asociado a current delivery.
   */
  @Property({ fieldName: 'current_delivery_id', type: 'uuid', nullable: true }) // FK → messaging.notification_deliveries
  currentDeliveryId?: string;

  /**
   * Identificador asociado a current status concept.
   */
  @Property({ fieldName: 'current_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  currentStatusConceptId!: string;

  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  @Property({ fieldName: 'idempotency_key', columnType: 'varchar' })
  idempotencyKey!: string;

  /**
   * Valor de snapshot json mantenido por la instancia.
   */
  @Property({ fieldName: 'snapshot_json', type: 'json', columnType: 'jsonb' })
  snapshotJson!: unknown;

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
  @Property({ fieldName: 'created_by_user_id', type: 'uuid' }) // FK → iam.users
  createdByUserId!: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid' }) // FK → iam.users
  updatedByUserId!: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
