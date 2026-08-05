import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `automation_approvals`.
 */
@Entity({ schema: 'automation', tableName: 'automation_approvals' })
export class AutomationApprovals {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a agent run.
   */
  @Property({ fieldName: 'agent_run_id', type: 'uuid' }) // FK → automation.agent_runs
  agentRunId!: string;

  /**
   * Identificador asociado a agent run step.
   */
  @Property({ fieldName: 'agent_run_step_id', type: 'uuid', nullable: true }) // FK → automation.agent_run_steps
  agentRunStepId?: string;

  /**
   * Identificador asociado a approval type concept.
   */
  @Property({ fieldName: 'approval_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  approvalTypeConceptId!: string;

  /**
   * Valor de requested action json mantenido por la instancia.
   */
  @Property({
    fieldName: 'requested_action_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  requestedActionJson?: unknown;

  /**
   * Valor de target resource type mantenido por la instancia.
   */
  @Property({
    fieldName: 'target_resource_type',
    columnType: 'varchar',
    nullable: true,
  })
  targetResourceType?: string;

  /**
   * Identificador asociado a target ref.
   */
  @Property({ fieldName: 'target_ref_id', type: 'uuid', nullable: true })
  targetRefId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Identificador asociado a decided by user.
   */
  @Property({ fieldName: 'decided_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  decidedByUserId?: string;

  /**
   * Valor de decided at mantenido por la instancia.
   */
  @Property({
    fieldName: 'decided_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  decidedAt?: Date;

  /**
   * Valor de decision note mantenido por la instancia.
   */
  @Property({ fieldName: 'decision_note', columnType: 'text', nullable: true })
  decisionNote?: string;

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
