import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `messaging_providers`.
 */
@Entity({ schema: 'messaging', tableName: 'messaging_providers' })
export class MessagingProviders {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de code mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Identificador asociado a provider type concept.
   */
  @Property({ fieldName: 'provider_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  providerTypeConceptId!: string;

  /**
   * Valor de capabilities json mantenido por la instancia.
   */
  @Property({
    fieldName: 'capabilities_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  capabilitiesJson?: unknown;

  /**
   * Identificador asociado a external provider.
   */
  @Property({ fieldName: 'external_provider_id', type: 'uuid', nullable: true }) // FK → integrations.external_providers
  externalProviderId?: string;

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
   * Valor de is builtin mantenido por la instancia.
   */
  @Property({ fieldName: 'is_builtin', type: 'boolean' })
  isBuiltin!: boolean;

  /**
   * Valor de supports webhooks mantenido por la instancia.
   */
  @Property({ fieldName: 'supports_webhooks', type: 'boolean' })
  supportsWebhooks!: boolean;

  /**
   * Valor de supports polling mantenido por la instancia.
   */
  @Property({ fieldName: 'supports_polling', type: 'boolean' })
  supportsPolling!: boolean;

  /**
   * Valor de supports delivery receipts mantenido por la instancia.
   */
  @Property({ fieldName: 'supports_delivery_receipts', type: 'boolean' })
  supportsDeliveryReceipts!: boolean;

  /**
   * Valor de supports read receipts mantenido por la instancia.
   */
  @Property({ fieldName: 'supports_read_receipts', type: 'boolean' })
  supportsReadReceipts!: boolean;

  /**
   * Valor de supports click receipts mantenido por la instancia.
   */
  @Property({ fieldName: 'supports_click_receipts', type: 'boolean' })
  supportsClickReceipts!: boolean;

  /**
   * Valor de supports reply receipts mantenido por la instancia.
   */
  @Property({ fieldName: 'supports_reply_receipts', type: 'boolean' })
  supportsReplyReceipts!: boolean;

  /**
   * Identificador asociado a provider time semantics concept.
   */
  @Property({
    fieldName: 'provider_time_semantics_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  providerTimeSemanticsConceptId?: string;
}
