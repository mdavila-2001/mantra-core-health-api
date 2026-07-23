import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'auth_providers', tableName: 'provider_protocol_configs' })
export class ProviderProtocolConfigs {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'provider_id', type: 'uuid' }) // FK (destino no resuelto)
  providerId!: string;

  @Property({ fieldName: 'environment_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  environmentConceptId!: string;

  @Property({ fieldName: 'client_id', columnType: 'varchar', nullable: true })
  clientId?: string;

  @Property({
    fieldName: 'client_secret_ref',
    columnType: 'varchar',
    nullable: true,
  })
  clientSecretRef?: string;

  @Property({ fieldName: 'authorize_url', columnType: 'text', nullable: true })
  authorizeUrl?: string;

  @Property({ fieldName: 'token_url', columnType: 'text', nullable: true })
  tokenUrl?: string;

  @Property({ fieldName: 'userinfo_url', columnType: 'text', nullable: true })
  userinfoUrl?: string;

  @Property({ fieldName: 'jwks_uri', columnType: 'text', nullable: true })
  jwksUri?: string;

  @Property({ fieldName: 'metadata_url', columnType: 'text', nullable: true })
  metadataUrl?: string;

  @Property({
    fieldName: 'saml_entity_id',
    columnType: 'varchar',
    nullable: true,
  })
  samlEntityId?: string;

  @Property({ fieldName: 'saml_acs_url', columnType: 'text', nullable: true })
  samlAcsUrl?: string;

  @Property({ columnType: 'varchar', nullable: true })
  scopes?: string;

  @Property({
    fieldName: 'response_type',
    columnType: 'varchar',
    nullable: true,
  })
  responseType?: string;

  @Property({
    fieldName: 'token_endpoint_auth_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  tokenEndpointAuthConceptId?: string;

  @Property({ fieldName: 'pkce_required', type: 'boolean', nullable: true })
  pkceRequired?: boolean;

  @Property({
    fieldName: 'extra_config_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  extraConfigJson?: unknown;

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
