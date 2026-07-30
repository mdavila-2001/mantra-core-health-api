import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `provider_protocol_configs`.
 */
@Entity({ schema: 'auth_providers', tableName: 'provider_protocol_configs' })
export class ProviderProtocolConfigs {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a provider.
   */
  @Property({ fieldName: 'provider_id', type: 'uuid' }) // FK → auth_providers.identity_providers
  providerId!: string;

  /**
   * Identificador asociado a environment concept.
   */
  @Property({ fieldName: 'environment_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  environmentConceptId!: string;

  /**
   * Identificador asociado a client.
   */
  @Property({ fieldName: 'client_id', columnType: 'varchar', nullable: true })
  clientId?: string;

  /**
   * Valor de client secret ref mantenido por la instancia.
   */
  @Property({
    fieldName: 'client_secret_ref',
    columnType: 'varchar',
    nullable: true,
  })
  clientSecretRef?: string;

  /**
   * Valor de authorize url mantenido por la instancia.
   */
  @Property({ fieldName: 'authorize_url', columnType: 'text', nullable: true })
  authorizeUrl?: string;

  /**
   * Valor de token url mantenido por la instancia.
   */
  @Property({ fieldName: 'token_url', columnType: 'text', nullable: true })
  tokenUrl?: string;

  /**
   * Valor de userinfo url mantenido por la instancia.
   */
  @Property({ fieldName: 'userinfo_url', columnType: 'text', nullable: true })
  userinfoUrl?: string;

  /**
   * Valor de jwks uri mantenido por la instancia.
   */
  @Property({ fieldName: 'jwks_uri', columnType: 'text', nullable: true })
  jwksUri?: string;

  /**
   * Valor de metadata url mantenido por la instancia.
   */
  @Property({ fieldName: 'metadata_url', columnType: 'text', nullable: true })
  metadataUrl?: string;

  /**
   * Identificador asociado a saml entity.
   */
  @Property({
    fieldName: 'saml_entity_id',
    columnType: 'varchar',
    nullable: true,
  })
  samlEntityId?: string;

  /**
   * Valor de saml acs url mantenido por la instancia.
   */
  @Property({ fieldName: 'saml_acs_url', columnType: 'text', nullable: true })
  samlAcsUrl?: string;

  /**
   * Valor de scopes mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  scopes?: string;

  /**
   * Valor de response type mantenido por la instancia.
   */
  @Property({
    fieldName: 'response_type',
    columnType: 'varchar',
    nullable: true,
  })
  responseType?: string;

  /**
   * Identificador asociado a token endpoint auth concept.
   */
  @Property({
    fieldName: 'token_endpoint_auth_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  tokenEndpointAuthConceptId?: string;

  /**
   * Valor de pkce required mantenido por la instancia.
   */
  @Property({ fieldName: 'pkce_required', type: 'boolean', nullable: true })
  pkceRequired?: boolean;

  /**
   * Valor de extra config json mantenido por la instancia.
   */
  @Property({
    fieldName: 'extra_config_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  extraConfigJson?: unknown;

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
}
