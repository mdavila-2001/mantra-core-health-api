import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'erp', tableName: 'business_partners' })
export class BusinessPartners {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'partner_number', columnType: 'varchar' })
  partnerNumber!: string;

  @Property({ fieldName: 'partner_category_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  partnerCategoryConceptId!: string;

  @Property({ fieldName: 'display_name', columnType: 'varchar' })
  displayName!: string;

  @Property({ fieldName: 'legal_name', columnType: 'varchar', nullable: true })
  legalName?: string;

  @Property({ fieldName: 'tax_id', columnType: 'varchar', nullable: true })
  taxId?: string;

  @Property({ fieldName: 'country_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  countryConceptId?: string;

  @Property({ fieldName: 'linked_tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  linkedTenantId?: string;

  @Property({ fieldName: 'linked_person_id', type: 'uuid', nullable: true }) // FK → profiles.persons
  linkedPersonId?: string;

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
