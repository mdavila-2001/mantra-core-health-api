import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `integration_auth_profiles`.
 */
@Entity({
  schema: 'integration_contracts',
  tableName: 'integration_auth_profiles',
})
export class IntegrationAuthProfiles {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a integration contract.
   */
  @Property({ fieldName: 'integration_contract_id', type: 'uuid' }) // FK → integration_contracts.integration_contracts
  integrationContractId!: string;

  /**
   * Identificador asociado a auth profile concept.
   */
  @Property({ fieldName: 'auth_profile_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  authProfileConceptId!: string;

  /**
   * Valor de oauth issuer uri mantenido por la instancia.
   */
  @Property({
    fieldName: 'oauth_issuer_uri',
    columnType: 'text',
    nullable: true,
  })
  oauthIssuerUri?: string;

  /**
   * Valor de client identifier mantenido por la instancia.
   */
  @Property({
    fieldName: 'client_identifier',
    columnType: 'varchar',
    nullable: true,
  })
  clientIdentifier?: string;

  /**
   * Valor de credential secret reference mantenido por la instancia.
   */
  @Property({
    fieldName: 'credential_secret_reference',
    columnType: 'text',
    nullable: true,
  })
  credentialSecretReference?: string;

  /**
   * Identificador asociado a token binding concept.
   */
  @Property({
    fieldName: 'token_binding_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  tokenBindingConceptId?: string;

  /**
   * Valor de mtls certificate reference mantenido por la instancia.
   */
  @Property({
    fieldName: 'mtls_certificate_reference',
    columnType: 'text',
    nullable: true,
  })
  mtlsCertificateReference?: string;

  /**
   * Valor de dpop key reference mantenido por la instancia.
   */
  @Property({
    fieldName: 'dpop_key_reference',
    columnType: 'text',
    nullable: true,
  })
  dpopKeyReference?: string;

  /**
   * Valor de scopes json mantenido por la instancia.
   */
  @Property({
    fieldName: 'scopes_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  scopesJson?: unknown;

  /**
   * Valor de audience mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  audience?: string;

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
