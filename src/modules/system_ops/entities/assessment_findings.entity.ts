import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `assessment_findings`.
 */
@Entity({ schema: 'system_ops', tableName: 'assessment_findings' })
export class AssessmentFindings {
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
   * Identificador asociado a assessment control result.
   */
  @Property({
    fieldName: 'assessment_control_result_id',
    type: 'uuid',
    nullable: true,
  }) // FK → system_ops.assessment_control_results
  assessmentControlResultId?: string;

  /**
   * Valor de finding code mantenido por la instancia.
   */
  @Property({ fieldName: 'finding_code', columnType: 'varchar' })
  findingCode!: string;

  /**
   * Valor de title mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  title!: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  description?: string;

  /**
   * Identificador asociado a severity concept.
   */
  @Property({ fieldName: 'severity_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  severityConceptId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de owner team mantenido por la instancia.
   */
  @Property({ fieldName: 'owner_team', columnType: 'varchar', nullable: true })
  ownerTeam?: string;

  /**
   * Valor de due at mantenido por la instancia.
   */
  @Property({ fieldName: 'due_at', columnType: 'timestamptz', nullable: true })
  dueAt?: Date;

  /**
   * Valor de risk acceptance expires at mantenido por la instancia.
   */
  @Property({
    fieldName: 'risk_acceptance_expires_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  riskAcceptanceExpiresAt?: Date;

  /**
   * Valor de closed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'closed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  closedAt?: Date;

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
