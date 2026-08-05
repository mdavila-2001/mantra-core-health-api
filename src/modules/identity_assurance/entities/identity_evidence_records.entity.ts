import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `identity_evidence_records`.
 */
@Entity({
  schema: 'identity_assurance',
  tableName: 'identity_evidence_records',
})
export class IdentityEvidenceRecords {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a identity verification case.
   */
  @Property({ fieldName: 'identity_verification_case_id', type: 'uuid' }) // FK → identity_assurance.identity_verification_cases
  identityVerificationCaseId!: string;

  /**
   * Identificador asociado a evidence type concept.
   */
  @Property({ fieldName: 'evidence_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  evidenceTypeConceptId!: string;

  /**
   * Identificador asociado a issuer authority.
   */
  @Property({ fieldName: 'issuer_authority_id', type: 'uuid', nullable: true }) // FK → identity_assurance.identity_authorities
  issuerAuthorityId?: string;

  /**
   * Valor de evidence identifier hash mantenido por la instancia.
   */
  @Property({
    fieldName: 'evidence_identifier_hash',
    columnType: 'varchar',
    nullable: true,
  })
  evidenceIdentifierHash?: string;

  /**
   * Identificador asociado a evidence file.
   */
  @Property({ fieldName: 'evidence_file_id', type: 'uuid', nullable: true }) // FK → common.files
  evidenceFileId?: string;

  /**
   * Valor de encrypted evidence reference mantenido por la instancia.
   */
  @Property({
    fieldName: 'encrypted_evidence_reference',
    columnType: 'text',
    nullable: true,
  })
  encryptedEvidenceReference?: string;

  /**
   * Identificador asociado a evidence quality concept.
   */
  @Property({
    fieldName: 'evidence_quality_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  evidenceQualityConceptId?: string;

  /**
   * Valor de issued at mantenido por la instancia.
   */
  @Property({
    fieldName: 'issued_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  issuedAt?: Date;

  /**
   * Valor de expires at mantenido por la instancia.
   */
  @Property({
    fieldName: 'expires_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  expiresAt?: Date;

  /**
   * Identificador asociado a collected under consent.
   */
  @Property({
    fieldName: 'collected_under_consent_id',
    type: 'uuid',
    nullable: true,
  }) // FK → consent.consents
  collectedUnderConsentId?: string;

  /**
   * Identificador asociado a verification status concept.
   */
  @Property({ fieldName: 'verification_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  verificationStatusConceptId!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
