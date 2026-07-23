import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'organization_extensions',
  tableName: 'organization_affiliations',
})
export class OrganizationAffiliations {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'primary_tenant_id', type: 'uuid' }) // FK → directory.tenants
  primaryTenantId!: string;

  @Property({ fieldName: 'participating_tenant_id', type: 'uuid' }) // FK → directory.tenants
  participatingTenantId!: string;

  @Property({ fieldName: 'affiliation_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  affiliationTypeConceptId!: string;

  @Property({
    fieldName: 'host_practice_site_id',
    type: 'uuid',
    nullable: true,
  }) // FK → practice.practice_sites
  hostPracticeSiteId?: string;

  @Property({
    fieldName: 'healthcare_service_id',
    type: 'uuid',
    nullable: true,
  }) // FK → practice.healthcare_services
  healthcareServiceId?: string;

  @Property({
    fieldName: 'contract_reference',
    columnType: 'varchar',
    nullable: true,
  })
  contractReference?: string;

  @Property({
    fieldName: 'data_use_agreement_id',
    type: 'uuid',
    nullable: true,
  }) // FK (destino no resuelto)
  dataUseAgreementId?: string;

  @Property({
    fieldName: 'valid_from',
    columnType: 'timestamptz',
    nullable: true,
  })
  validFrom?: Date;

  @Property({
    fieldName: 'valid_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  validTo?: Date;

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
