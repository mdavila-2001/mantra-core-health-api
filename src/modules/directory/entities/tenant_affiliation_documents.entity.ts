import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'directory', tableName: 'tenant_affiliation_documents' })
export class TenantAffiliationDocuments {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Property({ fieldName: 'document_type_concept_id', type: 'uuid' })
  documentTypeConceptId!: string;

  @Property({ fieldName: 'issuing_authority_concept_id', type: 'uuid' })
  issuingAuthorityConceptId!: string;

  @Property({ fieldName: 'file_id', type: 'uuid' })
  fileId!: string;

  @Property({ fieldName: 'identifier_id', type: 'uuid', nullable: true })
  identifierId?: string;

  @Property({ fieldName: 'related_person_id', type: 'uuid', nullable: true })
  relatedPersonId?: string;

  @Property({
    fieldName: 'document_number',
    columnType: 'varchar',
    nullable: true,
  })
  documentNumber?: string;

  @Property({ fieldName: 'registered_at', columnType: 'date', nullable: true })
  registeredAt?: string;

  @Property({ fieldName: 'issued_at', columnType: 'date', nullable: true })
  issuedAt?: string;

  @Property({ fieldName: 'valid_from', columnType: 'date', nullable: true })
  validFrom?: string;

  @Property({ fieldName: 'valid_to', columnType: 'date', nullable: true })
  validTo?: string;

  @Property({ fieldName: 'verification_status_concept_id', type: 'uuid' })
  verificationStatusConceptId!: string;

  @Property({ fieldName: 'verified_by_user_id', type: 'uuid', nullable: true })
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

  @Property({ fieldName: 'status_concept_id', type: 'uuid' })
  statusConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true })
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
