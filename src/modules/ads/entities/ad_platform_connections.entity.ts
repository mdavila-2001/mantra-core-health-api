import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'ad_platform_connections' })
export class AdPlatformConnections {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'business_manager_id', type: 'uuid' }) // FK → ads.business_managers
  businessManagerId!: string;

  @Property({ fieldName: 'ad_account_id', type: 'uuid', nullable: true }) // FK → ads.ad_accounts
  adAccountId?: string;

  @Property({ fieldName: 'platform_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  platformConceptId!: string;

  @Property({ fieldName: 'connection_name', columnType: 'varchar' })
  connectionName!: string;

  @Property({ fieldName: 'credential_id', type: 'uuid' }) // FK (destino no resuelto)
  credentialId!: string;

  @Property({ fieldName: 'api_version', columnType: 'varchar', nullable: true })
  apiVersion?: string;

  @Property({
    fieldName: 'external_business_id',
    columnType: 'varchar',
    nullable: true,
  })
  externalBusinessId?: string;

  @Property({
    fieldName: 'external_ad_account_id',
    columnType: 'varchar',
    nullable: true,
  })
  externalAdAccountId?: string;

  @Property({
    fieldName: 'webhook_verification_secret_id',
    type: 'uuid',
    nullable: true,
  }) // FK (destino no resuelto)
  webhookVerificationSecretId?: string;

  @Property({
    fieldName: 'token_expires_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  tokenExpiresAt?: Date;

  @Property({
    fieldName: 'last_successful_sync_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastSuccessfulSyncAt?: Date;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
}
