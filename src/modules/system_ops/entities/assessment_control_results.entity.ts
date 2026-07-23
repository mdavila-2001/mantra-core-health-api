import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'system_ops', tableName: 'assessment_control_results' })
export class AssessmentControlResults {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'workload_assessment_id', type: 'uuid' }) // FK → system_ops.workload_assessments
  workloadAssessmentId!: string;

  @Property({ fieldName: 'operational_framework_control_id', type: 'uuid' }) // FK → system_ops.operational_framework_controls
  operationalFrameworkControlId!: string;

  @Property({ fieldName: 'result_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  resultConceptId!: string;

  @Property({
    fieldName: 'maturity_level_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  maturityLevelConceptId?: string;

  @Property({
    fieldName: 'evidence_summary',
    columnType: 'text',
    nullable: true,
  })
  evidenceSummary?: string;

  @Property({
    fieldName: 'evidence_links_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  evidenceLinksJson?: unknown;

  @Property({ fieldName: 'assessor_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  assessorUserId?: string;

  @Property({ fieldName: 'assessed_at', columnType: 'timestamptz' })
  assessedAt!: Date;

  @Property({
    fieldName: 'risk_score',
    columnType: 'numeric(8,4)',
    nullable: true,
  })
  riskScore?: string;

  @Property({ fieldName: 'accepted_risk_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  acceptedRiskId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
