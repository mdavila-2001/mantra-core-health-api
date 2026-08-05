import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `remediation_actions`.
 */
@Entity({ schema: 'system_ops', tableName: 'remediation_actions' })
export class RemediationActions {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a remediation plan.
   */
  @Property({ fieldName: 'remediation_plan_id', type: 'uuid' }) // FK → system_ops.remediation_plans
  remediationPlanId!: string;

  /**
   * Identificador asociado a assessment finding.
   */
  @Property({ fieldName: 'assessment_finding_id', type: 'uuid' }) // FK → system_ops.assessment_findings
  assessmentFindingId!: string;

  /**
   * Valor de action code mantenido por la instancia.
   */
  @Property({ fieldName: 'action_code', columnType: 'varchar' })
  actionCode!: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @Property({ columnType: 'text' })
  description!: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Identificador asociado a assigned user.
   */
  @Property({ fieldName: 'assigned_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  assignedUserId?: string;

  /**
   * Valor de assigned team mantenido por la instancia.
   */
  @Property({
    fieldName: 'assigned_team',
    columnType: 'varchar',
    nullable: true,
  })
  assignedTeam?: string;

  /**
   * Valor de due at mantenido por la instancia.
   */
  @Property({ fieldName: 'due_at', columnType: 'timestamptz', nullable: true })
  dueAt?: Date;

  /**
   * Valor de completed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  completedAt?: Date;

  /**
   * Identificador asociado a verification user.
   */
  @Property({ fieldName: 'verification_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  verificationUserId?: string;

  /**
   * Valor de verification at mantenido por la instancia.
   */
  @Property({
    fieldName: 'verification_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  verificationAt?: Date;

  /**
   * Valor de verification evidence json mantenido por la instancia.
   */
  @Property({
    fieldName: 'verification_evidence_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  verificationEvidenceJson?: unknown;

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
