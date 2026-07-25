import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'payments', tableName: 'gateway_connections' })
export class GatewayConnections {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'gateway_id', type: 'uuid' }) // FK → payments.payment_gateways
  gatewayId!: string;

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'practice_id', type: 'uuid', nullable: true }) // FK → practice.practices
  practiceId?: string;

  @Property({ fieldName: 'environment_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  environmentConceptId!: string;

  @Property({
    fieldName: 'merchant_ref',
    columnType: 'varchar',
    nullable: true,
  })
  merchantRef?: string;

  @Property({ fieldName: 'credential_id', type: 'uuid', nullable: true }) // FK → integrations.provider_credentials
  credentialId?: string;

  @Property({
    fieldName: 'config_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  configJson?: unknown;

  @Property({
    fieldName: 'webhook_secret_ref',
    columnType: 'varchar',
    nullable: true,
  })
  webhookSecretRef?: string;

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
}
