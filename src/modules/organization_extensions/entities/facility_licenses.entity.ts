import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'organization_extensions', tableName: 'facility_licenses' })
export class FacilityLicenses {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'practice_site_id', type: 'uuid', nullable: true }) // FK → practice.practice_sites
  practiceSiteId?: string;

  @Property({ fieldName: 'facility_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  facilityTypeConceptId!: string;

  @Property({ fieldName: 'license_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  licenseTypeConceptId!: string;

  @Property({ fieldName: 'license_number', columnType: 'varchar' })
  licenseNumber!: string;

  @Property({
    fieldName: 'issuing_authority_tenant_id',
    type: 'uuid',
    nullable: true,
  }) // FK → directory.tenants
  issuingAuthorityTenantId?: string;

  @Property({
    fieldName: 'issuing_authority_name',
    columnType: 'varchar',
    nullable: true,
  })
  issuingAuthorityName?: string;

  @Property({
    fieldName: 'jurisdiction_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  jurisdictionConceptId?: string;

  @Property({ fieldName: 'valid_from', columnType: 'date', nullable: true })
  validFrom?: Date;

  @Property({ fieldName: 'valid_to', columnType: 'date', nullable: true })
  validTo?: Date;

  @Property({ fieldName: 'evidence_file_id', type: 'uuid', nullable: true }) // FK → common.files
  evidenceFileId?: string;

  @Property({ fieldName: 'verification_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  verificationStatusConceptId!: string;

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
