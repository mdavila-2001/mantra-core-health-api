import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'health_data', tableName: 'patient_match_decisions' })
export class PatientMatchDecisions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'patient_match_candidate_id', type: 'uuid' }) // FK → health_data.patient_match_candidates
  patientMatchCandidateId!: string;

  @Property({ fieldName: 'decision_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  decisionConceptId!: string;

  @Property({ fieldName: 'decided_by_user_id', type: 'uuid' }) // FK → iam.users
  decidedByUserId!: string;

  @Property({ fieldName: 'decided_at', columnType: 'timestamptz' })
  decidedAt!: Date;

  @Property({ fieldName: 'reason_text', columnType: 'text', nullable: true })
  reasonText?: string;

  @Property({ fieldName: 'resulting_cluster_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  resultingClusterId?: string;

  @Property({
    fieldName: 'evidence_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  evidenceJson?: unknown;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
