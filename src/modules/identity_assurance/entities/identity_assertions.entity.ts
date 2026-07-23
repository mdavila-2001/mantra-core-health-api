import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'identity_assurance', tableName: 'identity_assertions' })
export class IdentityAssertions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'identity_verification_case_id', type: 'uuid' }) // FK → identity_assurance.identity_verification_cases
  identityVerificationCaseId!: string;

  @Property({ fieldName: 'issuer_identity_authority_id', type: 'uuid' }) // FK → identity_assurance.identity_authorities
  issuerIdentityAuthorityId!: string;

  @Property({ fieldName: 'subject_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  subjectTypeConceptId!: string;

  @Property({ fieldName: 'subject_entity_id', type: 'uuid' })
  subjectEntityId!: string;

  @Property({ fieldName: 'assertion_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  assertionTypeConceptId!: string;

  @Property({ fieldName: 'assurance_level_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  assuranceLevelConceptId!: string;

  @Property({
    fieldName: 'assertion_identifier',
    columnType: 'varchar',
    nullable: true,
  })
  assertionIdentifier?: string;

  @Property({
    fieldName: 'assertion_hash',
    columnType: 'varchar',
    nullable: true,
  })
  assertionHash?: string;

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
    fieldName: 'revoked_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  revokedAt?: Date;

  @Property({
    fieldName: 'revocation_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  revocationReasonConceptId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
