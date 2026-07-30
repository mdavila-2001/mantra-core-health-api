import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `identity_authority_endpoints`.
 */
@Entity({
  schema: 'identity_assurance',
  tableName: 'identity_authority_endpoints',
})
export class IdentityAuthorityEndpoints {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a identity authority.
   */
  @Property({ fieldName: 'identity_authority_id', type: 'uuid' }) // FK → identity_assurance.identity_authorities
  identityAuthorityId!: string;

  /**
   * Identificador asociado a integration endpoint.
   */
  @Property({ fieldName: 'integration_endpoint_id', type: 'uuid' }) // FK → integrations.integration_endpoints
  integrationEndpointId!: string;

  /**
   * Identificador asociado a capability concept.
   */
  @Property({ fieldName: 'capability_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  capabilityConceptId!: string;

  /**
   * Identificador asociado a assurance level concept.
   */
  @Property({
    fieldName: 'assurance_level_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  assuranceLevelConceptId?: string;

  /**
   * Valor de request contract version mantenido por la instancia.
   */
  @Property({
    fieldName: 'request_contract_version',
    columnType: 'varchar',
    nullable: true,
  })
  requestContractVersion?: string;

  /**
   * Valor de response contract version mantenido por la instancia.
   */
  @Property({
    fieldName: 'response_contract_version',
    columnType: 'varchar',
    nullable: true,
  })
  responseContractVersion?: string;

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
