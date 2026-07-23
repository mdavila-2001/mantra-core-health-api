import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'identity_assurance',
  tableName: 'identity_verification_policies',
})
export class IdentityVerificationPolicies {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'policy_code', columnType: 'varchar' })
  policyCode!: string;

  @Property({ fieldName: 'subject_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  subjectTypeConceptId!: string;

  @Property({ fieldName: 'transaction_risk_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  transactionRiskConceptId!: string;

  @Property({
    fieldName: 'required_identity_assurance_level_concept_id',
    type: 'uuid',
  }) // FK → terminology.catalog_concepts
  requiredIdentityAssuranceLevelConceptId!: string;

  @Property({
    fieldName: 'required_authenticator_assurance_level_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  requiredAuthenticatorAssuranceLevelConceptId?: string;

  @Property({
    fieldName: 'required_federation_assurance_level_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  requiredFederationAssuranceLevelConceptId?: string;

  @Property({
    fieldName: 'evidence_requirements_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  evidenceRequirementsJson?: unknown;

  @Property({
    fieldName: 'fraud_controls_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  fraudControlsJson?: unknown;

  @Property({ fieldName: 'version_number', columnType: 'int' })
  versionNumber!: number;

  @Property({ fieldName: 'effective_from', columnType: 'timestamptz' })
  effectiveFrom!: Date;

  @Property({
    fieldName: 'effective_to',
    columnType: 'timestamptz',
    nullable: true,
  })
  effectiveTo?: Date;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
