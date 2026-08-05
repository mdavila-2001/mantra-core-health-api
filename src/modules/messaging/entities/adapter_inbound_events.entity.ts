import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `adapter_inbound_events`.
 */
@Entity({ schema: 'messaging', tableName: 'adapter_inbound_events' })
export class AdapterInboundEvents {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a provider.
   */
  @Property({ fieldName: 'provider_id', type: 'uuid' }) // FK → messaging.messaging_providers
  providerId!: string;

  /**
   * Identificador asociado a provider channel config.
   */
  @Property({ fieldName: 'provider_channel_config_id', type: 'uuid' }) // FK → messaging.provider_channel_configs
  providerChannelConfigId!: string;

  /**
   * Identificador asociado a channel.
   */
  @Property({ fieldName: 'channel_id', type: 'uuid' }) // FK → messaging.message_channels
  channelId!: string;

  /**
   * Identificador asociado a ingestion type concept.
   */
  @Property({ fieldName: 'ingestion_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  ingestionTypeConceptId!: string;

  /**
   * Identificador asociado a external event.
   */
  @Property({
    fieldName: 'external_event_id',
    columnType: 'varchar',
    nullable: true,
  })
  externalEventId?: string;

  /**
   * Valor de external event code mantenido por la instancia.
   */
  @Property({ fieldName: 'external_event_code', columnType: 'varchar' })
  externalEventCode!: string;

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
   * Valor de payload json encrypted mantenido por la instancia.
   */
  @Property({
    fieldName: 'payload_json_encrypted',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  payloadJsonEncrypted?: unknown;

  /**
   * Valor de payload storage ref mantenido por la instancia.
   */
  @Property({
    fieldName: 'payload_storage_ref',
    columnType: 'varchar',
    nullable: true,
  })
  payloadStorageRef?: string;

  /**
   * Valor de payload sha256 mantenido por la instancia.
   */
  @Property({ fieldName: 'payload_sha256', columnType: 'varchar' })
  payloadSha256!: string;

  /**
   * Valor de headers redacted json mantenido por la instancia.
   */
  @Property({
    fieldName: 'headers_redacted_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  headersRedactedJson?: unknown;

  /**
   * Identificador asociado a signature status concept.
   */
  @Property({ fieldName: 'signature_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  signatureStatusConceptId!: string;

  /**
   * Identificador asociado a replay status concept.
   */
  @Property({ fieldName: 'replay_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  replayStatusConceptId!: string;

  /**
   * Valor de received at mantenido por la instancia.
   */
  @Property({ fieldName: 'received_at', columnType: 'timestamptz' })
  receivedAt!: Date;

  /**
   * Valor de provider occurred at mantenido por la instancia.
   */
  @Property({
    fieldName: 'provider_occurred_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  providerOccurredAt?: Date;

  /**
   * Identificador asociado a processing status concept.
   */
  @Property({ fieldName: 'processing_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  processingStatusConceptId!: string;

  /**
   * Valor de processing attempts mantenido por la instancia.
   */
  @Property({ fieldName: 'processing_attempts', columnType: 'int' })
  processingAttempts!: number;

  /**
   * Valor de mapping version mantenido por la instancia.
   */
  @Property({ fieldName: 'mapping_version', columnType: 'int', nullable: true })
  mappingVersion?: number;

  /**
   * Identificador asociado a delivery.
   */
  @Property({ fieldName: 'delivery_id', type: 'uuid', nullable: true }) // FK → messaging.notification_deliveries
  deliveryId?: string;

  /**
   * Valor de normalization error code mantenido por la instancia.
   */
  @Property({
    fieldName: 'normalization_error_code',
    columnType: 'varchar',
    nullable: true,
  })
  normalizationErrorCode?: string;

  /**
   * Valor de normalization error detail mantenido por la instancia.
   */
  @Property({
    fieldName: 'normalization_error_detail',
    columnType: 'text',
    nullable: true,
  })
  normalizationErrorDetail?: string;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;
}
