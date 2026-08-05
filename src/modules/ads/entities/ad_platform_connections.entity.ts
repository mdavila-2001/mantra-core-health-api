import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `ad_platform_connections`.
 */
@Entity({ schema: 'ads', tableName: 'ad_platform_connections' })
export class AdPlatformConnections {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /**
   * Identificador asociado a business manager.
   */
  @Property({ fieldName: 'business_manager_id', type: 'uuid' }) // FK → ads.business_managers
  businessManagerId!: string;

  /**
   * Identificador asociado a ad account.
   */
  @Property({ fieldName: 'ad_account_id', type: 'uuid', nullable: true }) // FK → ads.ad_accounts
  adAccountId?: string;

  /**
   * Identificador asociado a platform concept.
   */
  @Property({ fieldName: 'platform_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  platformConceptId!: string;

  /**
   * Valor de connection name mantenido por la instancia.
   */
  @Property({ fieldName: 'connection_name', columnType: 'varchar' })
  connectionName!: string;

  /**
   * Identificador asociado a credential.
   */
  @Property({ fieldName: 'credential_id', type: 'uuid' }) // FK → integrations.provider_credentials
  credentialId!: string;

  /**
   * Valor de api version mantenido por la instancia.
   */
  @Property({ fieldName: 'api_version', columnType: 'varchar', nullable: true })
  apiVersion?: string;

  /**
   * Identificador asociado a external business.
   */
  @Property({
    fieldName: 'external_business_id',
    columnType: 'varchar',
    nullable: true,
  })
  externalBusinessId?: string;

  /**
   * Identificador asociado a external ad account.
   */
  @Property({
    fieldName: 'external_ad_account_id',
    columnType: 'varchar',
    nullable: true,
  })
  externalAdAccountId?: string;

  /**
   * Identificador asociado a webhook verification secret.
   */
  @Property({
    fieldName: 'webhook_verification_secret_id',
    type: 'uuid',
    nullable: true,
  }) // FK → system_ops.encryption_keys
  webhookVerificationSecretId?: string;

  /**
   * Valor de token expires at mantenido por la instancia.
   */
  @Property({
    fieldName: 'token_expires_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  tokenExpiresAt?: Date;

  /**
   * Valor de last successful sync at mantenido por la instancia.
   */
  @Property({
    fieldName: 'last_successful_sync_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastSuccessfulSyncAt?: Date;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
}
