import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'integration_contracts',
  tableName: 'integration_contract_versions',
})
export class IntegrationContractVersions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'integration_contract_id', type: 'uuid' }) // FK → integration_contracts.integration_contracts
  integrationContractId!: string;

  @Property({ fieldName: 'version_number', columnType: 'int' })
  versionNumber!: number;

  @Property({
    fieldName: 'request_schema_file_id',
    type: 'uuid',
    nullable: true,
  }) // FK → common.files
  requestSchemaFileId?: string;

  @Property({
    fieldName: 'response_schema_file_id',
    type: 'uuid',
    nullable: true,
  }) // FK → common.files
  responseSchemaFileId?: string;

  @Property({ fieldName: 'openapi_file_id', type: 'uuid', nullable: true }) // FK → common.files
  openapiFileId?: string;

  @Property({ fieldName: 'mapping_profile_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  mappingProfileId?: string;

  @Property({
    fieldName: 'effective_from',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveFrom?: Date;

  @Property({
    fieldName: 'effective_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveTo?: Date;

  @Property({
    fieldName: 'contract_hash',
    columnType: 'varchar',
    nullable: true,
  })
  contractHash?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
