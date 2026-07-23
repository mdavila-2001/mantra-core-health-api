import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'identity_assurance',
  tableName: 'identity_authority_endpoints',
})
export class IdentityAuthorityEndpoints {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'identity_authority_id', type: 'uuid' }) // FK → identity_assurance.identity_authorities
  identityAuthorityId!: string;

  @Property({ fieldName: 'integration_endpoint_id', type: 'uuid' }) // FK → integrations.integration_endpoints
  integrationEndpointId!: string;

  @Property({ fieldName: 'capability_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  capabilityConceptId!: string;

  @Property({
    fieldName: 'assurance_level_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  assuranceLevelConceptId?: string;

  @Property({
    fieldName: 'request_contract_version',
    columnType: 'varchar',
    nullable: true,
  })
  requestContractVersion?: string;

  @Property({
    fieldName: 'response_contract_version',
    columnType: 'varchar',
    nullable: true,
  })
  responseContractVersion?: string;

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
