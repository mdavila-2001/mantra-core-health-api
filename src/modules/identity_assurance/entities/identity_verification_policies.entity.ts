import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `identity_verification_policies`.
 */
@Entity({
  schema: 'identity_assurance',
  tableName: 'identity_verification_policies',
})
export class IdentityVerificationPolicies {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Valor de policy code mantenido por la instancia.
   */
  @Property({ fieldName: 'policy_code', columnType: 'varchar' })
  policyCode!: string;

  /**
   * Identificador asociado a subject type concept.
   */
  @Property({ fieldName: 'subject_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  subjectTypeConceptId!: string;

  /**
   * Identificador asociado a transaction risk concept.
   */
  @Property({ fieldName: 'transaction_risk_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  transactionRiskConceptId!: string;

  /**
   * Identificador asociado a required identity assurance level concept.
   */
  @Property({
    fieldName: 'required_identity_assurance_level_concept_id',
    type: 'uuid',
  }) // FK → terminology.catalog_concepts
  requiredIdentityAssuranceLevelConceptId!: string;

  /**
   * Identificador asociado a required authenticator assurance level concept.
   */
  @Property({
    fieldName: 'required_authenticator_assurance_level_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  requiredAuthenticatorAssuranceLevelConceptId?: string;

  /**
   * Identificador asociado a required federation assurance level concept.
   */
  @Property({
    fieldName: 'required_federation_assurance_level_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  requiredFederationAssuranceLevelConceptId?: string;

  /**
   * Valor de evidence requirements json mantenido por la instancia.
   */
  @Property({
    fieldName: 'evidence_requirements_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  evidenceRequirementsJson?: unknown;

  /**
   * Valor de fraud controls json mantenido por la instancia.
   */
  @Property({
    fieldName: 'fraud_controls_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  fraudControlsJson?: unknown;

  /**
   * Valor de version number mantenido por la instancia.
   */
  @Property({ fieldName: 'version_number', columnType: 'int' })
  versionNumber!: number;

  /**
   * Valor de effective from mantenido por la instancia.
   */
  @Property({ fieldName: 'effective_from', columnType: 'timestamptz' })
  effectiveFrom!: Date;

  /**
   * Valor de effective to mantenido por la instancia.
   */
  @Property({
    fieldName: 'effective_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveTo?: Date;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
