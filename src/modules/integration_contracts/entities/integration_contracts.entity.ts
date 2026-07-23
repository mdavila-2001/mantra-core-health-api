import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'integration_contracts', tableName: 'integration_contracts' })
export class IntegrationContracts {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'external_provider_id', type: 'uuid' }) // FK → integrations.external_providers
  externalProviderId!: string;

  @Property({ fieldName: 'contract_code', columnType: 'varchar' })
  contractCode!: string;

  @Property({ fieldName: 'capability_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  capabilityConceptId!: string;

  @Property({
    fieldName: 'data_classification_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  dataClassificationConceptId?: string;

  @Property({
    fieldName: 'legal_basis_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  legalBasisConceptId?: string;

  @Property({
    fieldName: 'allowed_purpose_value_set_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.value_sets
  allowedPurposeValueSetId?: string;

  @Property({
    fieldName: 'data_use_agreement_id',
    type: 'uuid',
    nullable: true,
  }) // FK (destino no resuelto)
  dataUseAgreementId?: string;

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
