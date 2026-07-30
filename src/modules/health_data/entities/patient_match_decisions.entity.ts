import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `patient_match_decisions`.
 */
@Entity({ schema: 'health_data', tableName: 'patient_match_decisions' })
export class PatientMatchDecisions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a patient match candidate.
   */
  @Property({ fieldName: 'patient_match_candidate_id', type: 'uuid' }) // FK → health_data.patient_match_candidates
  patientMatchCandidateId!: string;

  /**
   * Identificador asociado a decision concept.
   */
  @Property({ fieldName: 'decision_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  decisionConceptId!: string;

  /**
   * Identificador asociado a decided by user.
   */
  @Property({ fieldName: 'decided_by_user_id', type: 'uuid' }) // FK → iam.users
  decidedByUserId!: string;

  /**
   * Valor de decided at mantenido por la instancia.
   */
  @Property({ fieldName: 'decided_at', columnType: 'timestamptz' })
  decidedAt!: Date;

  /**
   * Valor de reason text mantenido por la instancia.
   */
  @Property({ fieldName: 'reason_text', columnType: 'text', nullable: true })
  reasonText?: string;

  /**
   * Identificador asociado a resulting cluster.
   */
  @Property({ fieldName: 'resulting_cluster_id', type: 'uuid', nullable: true }) // FK → health_data.patient_identity_clusters
  resultingClusterId?: string;

  /**
   * Valor de evidence json mantenido por la instancia.
   */
  @Property({
    fieldName: 'evidence_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  evidenceJson?: unknown;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
