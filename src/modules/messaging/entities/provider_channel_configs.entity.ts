import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `provider_channel_configs`.
 */
@Entity({ schema: 'messaging', tableName: 'provider_channel_configs' })
export class ProviderChannelConfigs {
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
   * Identificador asociado a channel.
   */
  @Property({ fieldName: 'channel_id', type: 'uuid' }) // FK → messaging.message_channels
  channelId!: string;

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  /**
   * Valor de sender identity mantenido por la instancia.
   */
  @Property({
    fieldName: 'sender_identity',
    columnType: 'varchar',
    nullable: true,
  })
  senderIdentity?: string;

  /**
   * Identificador asociado a credential.
   */
  @Property({ fieldName: 'credential_id', type: 'uuid', nullable: true }) // FK → integrations.provider_credentials
  credentialId?: string;

  /**
   * Valor de config json mantenido por la instancia.
   */
  @Property({
    fieldName: 'config_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  configJson?: unknown;

  /**
   * Valor de priority mantenido por la instancia.
   */
  @Property({ columnType: 'int', nullable: true })
  priority?: number;

  /**
   * Valor de rate limit per min mantenido por la instancia.
   */
  @Property({
    fieldName: 'rate_limit_per_min',
    columnType: 'int',
    nullable: true,
  })
  rateLimitPerMin?: number;

  /**
   * Identificador asociado a state concept.
   */
  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

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
   * Valor de adapter config version mantenido por la instancia.
   */
  @Property({ fieldName: 'adapter_config_version', columnType: 'int' })
  adapterConfigVersion!: number;

  /**
   * Valor de webhook endpoint key mantenido por la instancia.
   */
  @Property({
    fieldName: 'webhook_endpoint_key',
    columnType: 'varchar',
    nullable: true,
  })
  webhookEndpointKey?: string;

  /**
   * Identificador asociado a webhook secret credential.
   */
  @Property({
    fieldName: 'webhook_secret_credential_id',
    type: 'uuid',
    nullable: true,
  }) // FK → integrations.provider_credentials
  webhookSecretCredentialId?: string;

  /**
   * Identificador asociado a webhook signature scheme concept.
   */
  @Property({
    fieldName: 'webhook_signature_scheme_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  webhookSignatureSchemeConceptId?: string;

  /**
   * Identificador asociado a tracking mode concept.
   */
  @Property({ fieldName: 'tracking_mode_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  trackingModeConceptId!: string;

  /**
   * Valor de polling interval seconds mantenido por la instancia.
   */
  @Property({
    fieldName: 'polling_interval_seconds',
    columnType: 'int',
    nullable: true,
  })
  pollingIntervalSeconds?: number;

  /**
   * Valor de status mapping version mantenido por la instancia.
   */
  @Property({ fieldName: 'status_mapping_version', columnType: 'int' })
  statusMappingVersion!: number;

  /**
   * Valor de enabled at mantenido por la instancia.
   */
  @Property({
    fieldName: 'enabled_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  enabledAt?: Date;

  /**
   * Valor de disabled at mantenido por la instancia.
   */
  @Property({
    fieldName: 'disabled_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  disabledAt?: Date;

  /**
   * Identificador asociado a enabled by user.
   */
  @Property({ fieldName: 'enabled_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  enabledByUserId?: string;

  /**
   * Identificador asociado a disabled by user.
   */
  @Property({ fieldName: 'disabled_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  disabledByUserId?: string;
}
