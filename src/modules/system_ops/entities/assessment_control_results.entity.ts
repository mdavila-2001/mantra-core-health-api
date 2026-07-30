import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `assessment_control_results`.
 */
@Entity({ schema: 'system_ops', tableName: 'assessment_control_results' })
export class AssessmentControlResults {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a workload assessment.
   */
  @Property({ fieldName: 'workload_assessment_id', type: 'uuid' }) // FK → system_ops.workload_assessments
  workloadAssessmentId!: string;

  /**
   * Identificador asociado a operational framework control.
   */
  @Property({ fieldName: 'operational_framework_control_id', type: 'uuid' }) // FK → system_ops.operational_framework_controls
  operationalFrameworkControlId!: string;

  /**
   * Identificador asociado a result concept.
   */
  @Property({ fieldName: 'result_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  resultConceptId!: string;

  /**
   * Identificador asociado a maturity level concept.
   */
  @Property({
    fieldName: 'maturity_level_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  maturityLevelConceptId?: string;

  /**
   * Valor de evidence summary mantenido por la instancia.
   */
  @Property({
    fieldName: 'evidence_summary',
    columnType: 'text',
    nullable: true,
  })
  evidenceSummary?: string;

  /**
   * Valor de evidence links json mantenido por la instancia.
   */
  @Property({
    fieldName: 'evidence_links_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  evidenceLinksJson?: unknown;

  /**
   * Identificador asociado a assessor user.
   */
  @Property({ fieldName: 'assessor_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  assessorUserId?: string;

  /**
   * Valor de assessed at mantenido por la instancia.
   */
  @Property({ fieldName: 'assessed_at', columnType: 'timestamptz' })
  assessedAt!: Date;

  /**
   * Valor de risk score mantenido por la instancia.
   */
  @Property({
    fieldName: 'risk_score',
    columnType: 'numeric(8,4)',
    nullable: true,
  })
  riskScore?: string;

  /**
   * Identificador asociado a accepted risk.
   */
  @Property({ fieldName: 'accepted_risk_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  acceptedRiskId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
