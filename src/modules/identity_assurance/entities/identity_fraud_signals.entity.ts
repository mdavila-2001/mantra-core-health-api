import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `identity_fraud_signals`.
 */
@Entity({ schema: 'identity_assurance', tableName: 'identity_fraud_signals' })
export class IdentityFraudSignals {
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
   * Identificador asociado a signal type concept.
   */
  @Property({ fieldName: 'signal_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  signalTypeConceptId!: string;

  /**
   * Identificador asociado a severity concept.
   */
  @Property({ fieldName: 'severity_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  severityConceptId!: string;

  /**
   * Valor de confidence score mantenido por la instancia.
   */
  @Property({
    fieldName: 'confidence_score',
    columnType: 'numeric',
    nullable: true,
  })
  confidenceScore?: string;

  /**
   * Identificador asociado a source concept.
   */
  @Property({ fieldName: 'source_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  sourceConceptId?: string;

  /**
   * Valor de evidence reference mantenido por la instancia.
   */
  @Property({
    fieldName: 'evidence_reference',
    columnType: 'varchar',
    nullable: true,
  })
  evidenceReference?: string;

  /**
   * Valor de detected at mantenido por la instancia.
   */
  @Property({
    fieldName: 'detected_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  detectedAt?: Date;

  /**
   * Valor de resolved at mantenido por la instancia.
   */
  @Property({
    fieldName: 'resolved_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  resolvedAt?: Date;

  /**
   * Identificador asociado a resolution concept.
   */
  @Property({ fieldName: 'resolution_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  resolutionConceptId!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
