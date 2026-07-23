import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'identity_assurance', tableName: 'identity_fraud_signals' })
export class IdentityFraudSignals {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'identity_verification_case_id', type: 'uuid' }) // FK → identity_assurance.identity_verification_cases
  identityVerificationCaseId!: string;

  @Property({ fieldName: 'signal_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  signalTypeConceptId!: string;

  @Property({ fieldName: 'severity_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  severityConceptId!: string;

  @Property({
    fieldName: 'confidence_score',
    columnType: 'numeric',
    nullable: true,
  })
  confidenceScore?: string;

  @Property({ fieldName: 'source_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  sourceConceptId?: string;

  @Property({
    fieldName: 'evidence_reference',
    columnType: 'varchar',
    nullable: true,
  })
  evidenceReference?: string;

  @Property({
    fieldName: 'detected_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  detectedAt?: Date;

  @Property({
    fieldName: 'resolved_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  resolvedAt?: Date;

  @Property({ fieldName: 'resolution_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  resolutionConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
