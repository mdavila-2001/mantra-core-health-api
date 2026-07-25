import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'profiles', tableName: 'professional_credentials' })
export class ProfessionalCredentials {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'practitioner_profile_id', type: 'uuid' }) // FK → profiles.health_practitioner_profiles
  practitionerProfileId!: string;

  @Property({ fieldName: 'credential_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  credentialTypeConceptId!: string;

  @Property({ columnType: 'varchar' })
  number!: string;

  @Property({
    fieldName: 'issuing_authority_tenant_id',
    type: 'uuid',
    nullable: true,
  }) // FK → directory.tenants
  issuingAuthorityTenantId?: string;

  @Property({
    fieldName: 'issuing_institution_text',
    columnType: 'varchar',
    nullable: true,
  })
  issuingInstitutionText?: string;

  @Property({
    fieldName: 'issuing_country_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  issuingCountryConceptId?: string;

  @Property({ fieldName: 'issue_date', columnType: 'date', nullable: true })
  issueDate?: Date;

  @Property({ fieldName: 'expiry_date', columnType: 'date', nullable: true })
  expiryDate?: Date;

  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

  @Property({ fieldName: 'file_id', type: 'uuid', nullable: true }) // FK → common.files
  fileId?: string;

  @Property({
    fieldName: 'verification_source_uri',
    columnType: 'text',
    nullable: true,
  })
  verificationSourceUri?: string;

  @Property({ fieldName: 'verified_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  verifiedByUserId?: string;

  @Property({
    fieldName: 'verified_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  verifiedAt?: Date;

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
