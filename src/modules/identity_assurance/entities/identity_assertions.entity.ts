import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `identity_assertions`.
 */
@Entity({ schema: 'identity_assurance', tableName: 'identity_assertions' })
export class IdentityAssertions {
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
   * Identificador asociado a issuer identity authority.
   */
  @Property({ fieldName: 'issuer_identity_authority_id', type: 'uuid' }) // FK → identity_assurance.identity_authorities
  issuerIdentityAuthorityId!: string;

  /**
   * Identificador asociado a subject type concept.
   */
  @Property({ fieldName: 'subject_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  subjectTypeConceptId!: string;

  /**
   * Identificador asociado a subject entity.
   */
  @Property({ fieldName: 'subject_entity_id', type: 'uuid' })
  subjectEntityId!: string;

  /**
   * Identificador asociado a assertion type concept.
   */
  @Property({ fieldName: 'assertion_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  assertionTypeConceptId!: string;

  /**
   * Identificador asociado a assurance level concept.
   */
  @Property({ fieldName: 'assurance_level_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  assuranceLevelConceptId!: string;

  /**
   * Valor de assertion identifier mantenido por la instancia.
   */
  @Property({
    fieldName: 'assertion_identifier',
    columnType: 'varchar',
    nullable: true,
  })
  assertionIdentifier?: string;

  /**
   * Valor de assertion hash mantenido por la instancia.
   */
  @Property({
    fieldName: 'assertion_hash',
    columnType: 'varchar',
    nullable: true,
  })
  assertionHash?: string;

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
   * Valor de revoked at mantenido por la instancia.
   */
  @Property({
    fieldName: 'revoked_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  revokedAt?: Date;

  /**
   * Identificador asociado a revocation reason concept.
   */
  @Property({
    fieldName: 'revocation_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  revocationReasonConceptId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
