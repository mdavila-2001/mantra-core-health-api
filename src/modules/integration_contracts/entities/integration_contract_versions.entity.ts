import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `integration_contract_versions`.
 */
@Entity({
  schema: 'integration_contracts',
  tableName: 'integration_contract_versions',
})
export class IntegrationContractVersions {
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
   * Valor de version number mantenido por la instancia.
   */
  @Property({ fieldName: 'version_number', columnType: 'int' })
  versionNumber!: number;

  /**
   * Identificador asociado a request schema file.
   */
  @Property({
    fieldName: 'request_schema_file_id',
    type: 'uuid',
    nullable: true,
  }) // FK → common.files
  requestSchemaFileId?: string;

  /**
   * Identificador asociado a response schema file.
   */
  @Property({
    fieldName: 'response_schema_file_id',
    type: 'uuid',
    nullable: true,
  }) // FK → common.files
  responseSchemaFileId?: string;

  /**
   * Identificador asociado a openapi file.
   */
  @Property({ fieldName: 'openapi_file_id', type: 'uuid', nullable: true }) // FK → common.files
  openapiFileId?: string;

  /**
   * Identificador asociado a mapping profile.
   */
  @Property({ fieldName: 'mapping_profile_id', type: 'uuid', nullable: true }) // FK → integration_contracts.integration_auth_profiles
  mappingProfileId?: string;

  /**
   * Valor de effective from mantenido por la instancia.
   */
  @Property({
    fieldName: 'effective_from',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveFrom?: Date;

  /**
   * Valor de effective to mantenido por la instancia.
   */
  @Property({
    fieldName: 'effective_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveTo?: Date;

  /**
   * Valor de contract hash mantenido por la instancia.
   */
  @Property({
    fieldName: 'contract_hash',
    columnType: 'varchar',
    nullable: true,
  })
  contractHash?: string;

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
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
