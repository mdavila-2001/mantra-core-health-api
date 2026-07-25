import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'directory', tableName: 'tenant_legal_representatives' })
export class TenantLegalRepresentatives {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'person_id', type: 'uuid' }) // FK → profiles.persons
  personId!: string;

  @Property({ fieldName: 'representative_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  representativeRoleConceptId!: string;

  @Property({ fieldName: 'ci_identifier_id', type: 'uuid', nullable: true }) // FK → common.identifiers
  ciIdentifierId?: string;

  @Property({
    fieldName: 'power_of_attorney_document_id',
    type: 'uuid',
    nullable: true,
  }) // FK → directory.tenant_affiliation_documents
  powerOfAttorneyDocumentId?: string;

  @Property({ fieldName: 'appointed_at', columnType: 'date', nullable: true })
  appointedAt?: Date;

  @Property({ fieldName: 'valid_from', columnType: 'date', nullable: true })
  validFrom?: Date;

  @Property({ fieldName: 'valid_to', columnType: 'date', nullable: true })
  validTo?: Date;

  @Property({ fieldName: 'is_primary', type: 'boolean', nullable: true })
  isPrimary?: boolean;

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
