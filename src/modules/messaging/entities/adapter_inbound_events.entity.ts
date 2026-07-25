import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'messaging', tableName: 'adapter_inbound_events' })
export class AdapterInboundEvents {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'provider_id', type: 'uuid' }) // FK → messaging.messaging_providers
  providerId!: string;

  @Property({ fieldName: 'provider_channel_config_id', type: 'uuid' }) // FK → messaging.provider_channel_configs
  providerChannelConfigId!: string;

  @Property({ fieldName: 'channel_id', type: 'uuid' }) // FK → messaging.message_channels
  channelId!: string;

  @Property({ fieldName: 'ingestion_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  ingestionTypeConceptId!: string;

  @Property({
    fieldName: 'external_event_id',
    columnType: 'varchar',
    nullable: true,
  })
  externalEventId?: string;

  @Property({ fieldName: 'external_event_code', columnType: 'varchar' })
  externalEventCode!: string;

  @Property({
    fieldName: 'provider_message_ref',
    columnType: 'varchar',
    nullable: true,
  })
  providerMessageRef?: string;

  @Property({
    fieldName: 'payload_json_encrypted',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  payloadJsonEncrypted?: unknown;

  @Property({
    fieldName: 'payload_storage_ref',
    columnType: 'varchar',
    nullable: true,
  })
  payloadStorageRef?: string;

  @Property({ fieldName: 'payload_sha256', columnType: 'varchar' })
  payloadSha256!: string;

  @Property({
    fieldName: 'headers_redacted_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  headersRedactedJson?: unknown;

  @Property({ fieldName: 'signature_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  signatureStatusConceptId!: string;

  @Property({ fieldName: 'replay_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  replayStatusConceptId!: string;

  @Property({ fieldName: 'received_at', columnType: 'timestamptz' })
  receivedAt!: Date;

  @Property({
    fieldName: 'provider_occurred_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  providerOccurredAt?: Date;

  @Property({ fieldName: 'processing_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  processingStatusConceptId!: string;

  @Property({ fieldName: 'processing_attempts', columnType: 'int' })
  processingAttempts!: number;

  @Property({ fieldName: 'mapping_version', columnType: 'int', nullable: true })
  mappingVersion?: number;

  @Property({ fieldName: 'delivery_id', type: 'uuid', nullable: true }) // FK → messaging.notification_deliveries
  deliveryId?: string;

  @Property({
    fieldName: 'normalization_error_code',
    columnType: 'varchar',
    nullable: true,
  })
  normalizationErrorCode?: string;

  @Property({
    fieldName: 'normalization_error_detail',
    columnType: 'text',
    nullable: true,
  })
  normalizationErrorDetail?: string;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;
}
