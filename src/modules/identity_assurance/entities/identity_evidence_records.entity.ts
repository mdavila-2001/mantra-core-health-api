import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'identity_assurance',
  tableName: 'identity_evidence_records',
})
export class IdentityEvidenceRecords {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'identity_verification_case_id', type: 'uuid' }) // FK → identity_assurance.identity_verification_cases
  identityVerificationCaseId!: string;

  @Property({ fieldName: 'evidence_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  evidenceTypeConceptId!: string;

  @Property({ fieldName: 'issuer_authority_id', type: 'uuid', nullable: true }) // FK → identity_assurance.identity_authorities
  issuerAuthorityId?: string;

  @Property({
    fieldName: 'evidence_identifier_hash',
    columnType: 'varchar',
    nullable: true,
  })
  evidenceIdentifierHash?: string;

  @Property({ fieldName: 'evidence_file_id', type: 'uuid', nullable: true }) // FK → common.files
  evidenceFileId?: string;

  @Property({
    fieldName: 'encrypted_evidence_reference',
    columnType: 'text',
    nullable: true,
  })
  encryptedEvidenceReference?: string;

  @Property({
    fieldName: 'evidence_quality_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  evidenceQualityConceptId?: string;

  @Property({
    fieldName: 'issued_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  issuedAt?: Date;

  @Property({
    fieldName: 'expires_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  expiresAt?: Date;

  @Property({
    fieldName: 'collected_under_consent_id',
    type: 'uuid',
    nullable: true,
  }) // FK → consent.consents
  collectedUnderConsentId?: string;

  @Property({ fieldName: 'verification_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  verificationStatusConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
