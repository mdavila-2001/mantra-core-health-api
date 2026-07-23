import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'integration_contracts',
  tableName: 'integration_auth_profiles',
})
export class IntegrationAuthProfiles {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'integration_contract_id', type: 'uuid' }) // FK → integration_contracts.integration_contracts
  integrationContractId!: string;

  @Property({ fieldName: 'auth_profile_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  authProfileConceptId!: string;

  @Property({
    fieldName: 'oauth_issuer_uri',
    columnType: 'text',
    nullable: true,
  })
  oauthIssuerUri?: string;

  @Property({
    fieldName: 'client_identifier',
    columnType: 'varchar',
    nullable: true,
  })
  clientIdentifier?: string;

  @Property({
    fieldName: 'credential_secret_reference',
    columnType: 'text',
    nullable: true,
  })
  credentialSecretReference?: string;

  @Property({
    fieldName: 'token_binding_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  tokenBindingConceptId?: string;

  @Property({
    fieldName: 'mtls_certificate_reference',
    columnType: 'text',
    nullable: true,
  })
  mtlsCertificateReference?: string;

  @Property({
    fieldName: 'dpop_key_reference',
    columnType: 'text',
    nullable: true,
  })
  dpopKeyReference?: string;

  @Property({
    fieldName: 'scopes_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  scopesJson?: unknown;

  @Property({ columnType: 'varchar', nullable: true })
  audience?: string;

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
