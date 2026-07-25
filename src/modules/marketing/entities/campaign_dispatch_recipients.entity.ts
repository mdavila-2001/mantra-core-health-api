import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'marketing', tableName: 'campaign_dispatch_recipients' })
export class CampaignDispatchRecipients {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'dispatch_id', type: 'uuid' }) // FK → marketing.campaign_dispatches
  dispatchId!: string;

  @Property({ fieldName: 'member_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  memberTypeConceptId!: string;

  @Property({ fieldName: 'member_ref_id', type: 'uuid' })
  memberRefId!: string;

  @Property({
    fieldName: 'recipient_endpoint_id',
    type: 'uuid',
    nullable: true,
  }) // FK → crm.contact_channel_endpoints
  recipientEndpointId?: string;

  @Property({ fieldName: 'recipient_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recipientUserId?: string;

  @Property({ fieldName: 'channel_id', type: 'uuid' }) // FK → messaging.message_channels
  channelId!: string;

  @Property({ fieldName: 'language_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  languageConceptId?: string;

  @Property({
    fieldName: 'timezone_name',
    columnType: 'varchar',
    nullable: true,
  })
  timezoneName?: string;

  @Property({ fieldName: 'consent_id', type: 'uuid', nullable: true }) // FK → consent.consents
  consentId?: string;

  @Property({ fieldName: 'consent_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  consentStatusConceptId!: string;

  @Property({
    fieldName: 'preference_snapshot_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  preferenceSnapshotJson?: unknown;

  @Property({ fieldName: 'eligibility_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  eligibilityStatusConceptId!: string;

  @Property({
    fieldName: 'suppression_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  suppressionReasonConceptId?: string;

  @Property({
    fieldName: 'suppression_detail',
    columnType: 'varchar',
    nullable: true,
  })
  suppressionDetail?: string;

  @Property({ fieldName: 'scheduled_at', columnType: 'timestamptz' })
  scheduledAt!: Date;

  @Property({
    fieldName: 'notification_request_id',
    type: 'uuid',
    nullable: true,
  }) // FK → messaging.notification_requests
  notificationRequestId?: string;

  @Property({ fieldName: 'current_delivery_id', type: 'uuid', nullable: true }) // FK → messaging.notification_deliveries
  currentDeliveryId?: string;

  @Property({ fieldName: 'current_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  currentStatusConceptId!: string;

  @Property({ fieldName: 'idempotency_key', columnType: 'varchar' })
  idempotencyKey!: string;

  @Property({ fieldName: 'snapshot_json', type: 'json', columnType: 'jsonb' })
  snapshotJson!: unknown;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid' }) // FK → iam.users
  createdByUserId!: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid' }) // FK → iam.users
  updatedByUserId!: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
