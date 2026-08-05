import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `notification_deliveries`.
 */
@Entity({ schema: 'messaging', tableName: 'notification_deliveries' })
export class NotificationDeliveries {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a notification request.
   */
  @Property({ fieldName: 'notification_request_id', type: 'uuid' }) // FK → messaging.notification_requests
  notificationRequestId!: string;

  /**
   * Identificador asociado a provider.
   */
  @Property({ fieldName: 'provider_id', type: 'uuid' }) // FK → messaging.messaging_providers
  providerId!: string;

  /**
   * Identificador asociado a channel.
   */
  @Property({ fieldName: 'channel_id', type: 'uuid' }) // FK → messaging.message_channels
  channelId!: string;

  /**
   * Valor de attempt number mantenido por la instancia.
   */
  @Property({ fieldName: 'attempt_number', columnType: 'int' })
  attemptNumber!: number;

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
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de error code mantenido por la instancia.
   */
  @Property({ fieldName: 'error_code', columnType: 'varchar', nullable: true })
  errorCode?: string;

  /**
   * Valor de error text mantenido por la instancia.
   */
  @Property({ fieldName: 'error_text', columnType: 'text', nullable: true })
  errorText?: string;

  /**
   * Valor de cost amount mantenido por la instancia.
   */
  @Property({ fieldName: 'cost_amount', columnType: 'numeric', nullable: true })
  costAmount?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  /**
   * Valor de sent at mantenido por la instancia.
   */
  @Property({ fieldName: 'sent_at', columnType: 'timestamptz', nullable: true })
  sentAt?: Date;

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
   * Identificador asociado a provider channel config.
   */
  @Property({ fieldName: 'provider_channel_config_id', type: 'uuid' }) // FK → messaging.provider_channel_configs
  providerChannelConfigId!: string;

  /**
   * Valor de adapter code mantenido por la instancia.
   */
  @Property({ fieldName: 'adapter_code', columnType: 'varchar' })
  adapterCode!: string;

  /**
   * Valor de adapter version mantenido por la instancia.
   */
  @Property({ fieldName: 'adapter_version', columnType: 'varchar' })
  adapterVersion!: string;

  /**
   * Valor de started at mantenido por la instancia.
   */
  @Property({
    fieldName: 'started_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startedAt?: Date;

  /**
   * Valor de accepted at mantenido por la instancia.
   */
  @Property({
    fieldName: 'accepted_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  acceptedAt?: Date;

  /**
   * Valor de delivered at mantenido por la instancia.
   */
  @Property({
    fieldName: 'delivered_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  deliveredAt?: Date;

  /**
   * Valor de seen at mantenido por la instancia.
   */
  @Property({ fieldName: 'seen_at', columnType: 'timestamptz', nullable: true })
  seenAt?: Date;

  /**
   * Valor de read at mantenido por la instancia.
   */
  @Property({ fieldName: 'read_at', columnType: 'timestamptz', nullable: true })
  readAt?: Date;

  /**
   * Valor de clicked at mantenido por la instancia.
   */
  @Property({
    fieldName: 'clicked_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  clickedAt?: Date;

  /**
   * Valor de replied at mantenido por la instancia.
   */
  @Property({
    fieldName: 'replied_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  repliedAt?: Date;

  /**
   * Valor de bounced at mantenido por la instancia.
   */
  @Property({
    fieldName: 'bounced_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  bouncedAt?: Date;

  /**
   * Valor de failed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'failed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  failedAt?: Date;

  /**
   * Valor de cancelled at mantenido por la instancia.
   */
  @Property({
    fieldName: 'cancelled_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  cancelledAt?: Date;

  /**
   * Valor de expired at mantenido por la instancia.
   */
  @Property({
    fieldName: 'expired_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  expiredAt?: Date;

  /**
   * Valor de terminal at mantenido por la instancia.
   */
  @Property({
    fieldName: 'terminal_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  terminalAt?: Date;

  /**
   * Valor de last event at mantenido por la instancia.
   */
  @Property({
    fieldName: 'last_event_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastEventAt?: Date;

  /**
   * Identificador asociado a last event.
   */
  @Property({ fieldName: 'last_event_id', type: 'uuid', nullable: true }) // FK → messaging.delivery_tracking_events
  lastEventId?: string;

  /**
   * Valor de provider status raw mantenido por la instancia.
   */
  @Property({
    fieldName: 'provider_status_raw',
    columnType: 'varchar',
    nullable: true,
  })
  providerStatusRaw?: string;

  /**
   * Valor de provider response hash mantenido por la instancia.
   */
  @Property({
    fieldName: 'provider_response_hash',
    columnType: 'varchar',
    nullable: true,
  })
  providerResponseHash?: string;
}
