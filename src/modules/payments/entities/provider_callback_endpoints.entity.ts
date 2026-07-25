import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'payments', tableName: 'provider_callback_endpoints' })
export class ProviderCallbackEndpoints {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'gateway_connection_id', type: 'uuid' }) // FK → payments.gateway_connections
  gatewayConnectionId!: string;

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ fieldName: 'callback_path', columnType: 'varchar' })
  callbackPath!: string;

  @Property({ fieldName: 'verification_method_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  verificationMethodConceptId!: string;

  @Property({
    fieldName: 'verification_secret_id',
    type: 'uuid',
    nullable: true,
  }) // FK → system_ops.encryption_keys
  verificationSecretId?: string;

  @Property({
    fieldName: 'allowed_source_cidrs_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  allowedSourceCidrsJson?: unknown;

  @Property({
    fieldName: 'replay_window_seconds',
    columnType: 'int',
    nullable: true,
  })
  replayWindowSeconds?: number;

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
