import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'messaging', tableName: 'provider_channel_configs' })
export class ProviderChannelConfigs {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'provider_id', type: 'uuid' }) // FK → messaging.messaging_providers
  providerId!: string;

  @Property({ fieldName: 'channel_id', type: 'uuid' }) // FK → messaging.message_channels
  channelId!: string;

  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  @Property({
    fieldName: 'sender_identity',
    columnType: 'varchar',
    nullable: true,
  })
  senderIdentity?: string;

  @Property({ fieldName: 'credential_id', type: 'uuid', nullable: true }) // FK → integrations.provider_credentials
  credentialId?: string;

  @Property({
    fieldName: 'config_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  configJson?: unknown;

  @Property({ columnType: 'int', nullable: true })
  priority?: number;

  @Property({
    fieldName: 'rate_limit_per_min',
    columnType: 'int',
    nullable: true,
  })
  rateLimitPerMin?: number;

  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

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

  @Property({ fieldName: 'adapter_config_version', columnType: 'int' })
  adapterConfigVersion!: number;

  @Property({
    fieldName: 'webhook_endpoint_key',
    columnType: 'varchar',
    nullable: true,
  })
  webhookEndpointKey?: string;

  @Property({
    fieldName: 'webhook_secret_credential_id',
    type: 'uuid',
    nullable: true,
  }) // FK → integrations.provider_credentials
  webhookSecretCredentialId?: string;

  @Property({
    fieldName: 'webhook_signature_scheme_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  webhookSignatureSchemeConceptId?: string;

  @Property({ fieldName: 'tracking_mode_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  trackingModeConceptId!: string;

  @Property({
    fieldName: 'polling_interval_seconds',
    columnType: 'int',
    nullable: true,
  })
  pollingIntervalSeconds?: number;

  @Property({ fieldName: 'status_mapping_version', columnType: 'int' })
  statusMappingVersion!: number;

  @Property({
    fieldName: 'enabled_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  enabledAt?: Date;

  @Property({
    fieldName: 'disabled_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  disabledAt?: Date;

  @Property({ fieldName: 'enabled_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  enabledByUserId?: string;

  @Property({ fieldName: 'disabled_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  disabledByUserId?: string;
}
