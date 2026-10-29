import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'practice', tableName: 'site_licenses' })
export class SiteLicenses {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants (inferida)
  tenantId!: string;

  @Property({ fieldName: 'practice_site_id', type: 'uuid' }) // FK → practice.practice_sites (inferida)
  practiceSiteId!: string;

  @Property({ fieldName: 'authority_name', columnType: 'varchar' })
  authorityName!: string;

  @Property({
    fieldName: 'resolution_number',
    columnType: 'varchar',
    nullable: true,
  })
  resolutionNumber?: string;

  @Property({ fieldName: 'issued_on', columnType: 'date', nullable: true })
  issuedOn?: Date;

  @Property({ fieldName: 'expires_on', columnType: 'date', nullable: true })
  expiresOn?: Date;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts (inferida)
  statusConceptId!: string;

  @Property({ fieldName: 'clinical_unit_id', type: 'uuid', nullable: true }) // FK → practice.clinical_units (inferida)
  clinicalUnitId?: string;

  @Property({
    fieldName: 'healthcare_service_id',
    type: 'uuid',
    nullable: true,
  }) // FK → practice.healthcare_services (inferida)
  healthcareServiceId?: string;

  @Property({ fieldName: 'document_file_id', type: 'uuid', nullable: true }) // FK → common.files (inferida)
  documentFileId?: string;

  @Property({ columnType: 'text', nullable: true })
  notes?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users (inferida)
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
