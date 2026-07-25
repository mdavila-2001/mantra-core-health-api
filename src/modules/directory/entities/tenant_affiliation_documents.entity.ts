import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'directory', tableName: 'tenant_affiliation_documents' })
export class TenantAffiliationDocuments {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'document_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  documentTypeConceptId!: string;

  @Property({ fieldName: 'issuing_authority_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  issuingAuthorityConceptId!: string;

  @Property({ fieldName: 'file_id', type: 'uuid' }) // FK → common.files
  fileId!: string;

  @Property({ fieldName: 'identifier_id', type: 'uuid', nullable: true }) // FK → common.identifiers
  identifierId?: string;

  @Property({ fieldName: 'related_person_id', type: 'uuid', nullable: true }) // FK → profiles.persons
  relatedPersonId?: string;

  @Property({
    fieldName: 'document_number',
    columnType: 'varchar',
    nullable: true,
  })
  documentNumber?: string;

  @Property({ fieldName: 'registered_at', columnType: 'date', nullable: true })
  registeredAt?: Date;

  @Property({ fieldName: 'issued_at', columnType: 'date', nullable: true })
  issuedAt?: Date;

  @Property({ fieldName: 'valid_from', columnType: 'date', nullable: true })
  validFrom?: Date;

  @Property({ fieldName: 'valid_to', columnType: 'date', nullable: true })
  validTo?: Date;

  @Property({ fieldName: 'verification_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  verificationStatusConceptId!: string;

  @Property({ fieldName: 'verified_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  verifiedByUserId?: string;

  @Property({
    fieldName: 'verified_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  verifiedAt?: Date;

  @Property({
    fieldName: 'is_required_for_affiliation',
    type: 'boolean',
    nullable: true,
  })
  isRequiredForAffiliation?: boolean;

  @Property({ columnType: 'varchar', nullable: true })
  notes?: string;

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
