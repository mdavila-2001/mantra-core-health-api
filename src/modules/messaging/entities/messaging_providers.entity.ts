import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'messaging', tableName: 'messaging_providers' })
export class MessagingProviders {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'provider_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  providerTypeConceptId!: string;

  @Property({
    fieldName: 'capabilities_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  capabilitiesJson?: unknown;

  @Property({ fieldName: 'external_provider_id', type: 'uuid', nullable: true }) // FK → integrations.external_providers
  externalProviderId?: string;

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

  @Property({ fieldName: 'adapter_code', columnType: 'varchar' })
  adapterCode!: string;

  @Property({ fieldName: 'adapter_version', columnType: 'varchar' })
  adapterVersion!: string;

  @Property({ fieldName: 'is_builtin', type: 'boolean' })
  isBuiltin!: boolean;

  @Property({ fieldName: 'supports_webhooks', type: 'boolean' })
  supportsWebhooks!: boolean;

  @Property({ fieldName: 'supports_polling', type: 'boolean' })
  supportsPolling!: boolean;

  @Property({ fieldName: 'supports_delivery_receipts', type: 'boolean' })
  supportsDeliveryReceipts!: boolean;

  @Property({ fieldName: 'supports_read_receipts', type: 'boolean' })
  supportsReadReceipts!: boolean;

  @Property({ fieldName: 'supports_click_receipts', type: 'boolean' })
  supportsClickReceipts!: boolean;

  @Property({ fieldName: 'supports_reply_receipts', type: 'boolean' })
  supportsReplyReceipts!: boolean;

  @Property({
    fieldName: 'provider_time_semantics_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  providerTimeSemanticsConceptId?: string;
}
