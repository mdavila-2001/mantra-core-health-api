import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `workflow_steps`.
 */
@Entity({ schema: 'automation', tableName: 'workflow_steps' })
export class WorkflowSteps {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a workflow.
   */
  @Property({ fieldName: 'workflow_id', type: 'uuid' }) // FK → automation.workflows
  workflowId!: string;

  /**
   * Valor de step code mantenido por la instancia.
   */
  @Property({ fieldName: 'step_code', columnType: 'varchar' })
  stepCode!: string;

  /**
   * Identificador asociado a step type concept.
   */
  @Property({ fieldName: 'step_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stepTypeConceptId!: string;

  /**
   * Identificador asociado a agent.
   */
  @Property({ fieldName: 'agent_id', type: 'uuid', nullable: true }) // FK → automation.agents
  agentId?: string;

  /**
   * Identificador asociado a agent tool.
   */
  @Property({ fieldName: 'agent_tool_id', type: 'uuid', nullable: true }) // FK → automation.agent_tools
  agentToolId?: string;

  /**
   * Identificador asociado a on success step.
   */
  @Property({ fieldName: 'on_success_step_id', type: 'uuid', nullable: true }) // FK → automation.workflow_steps
  onSuccessStepId?: string;

  /**
   * Identificador asociado a on failure step.
   */
  @Property({ fieldName: 'on_failure_step_id', type: 'uuid', nullable: true }) // FK → automation.workflow_steps
  onFailureStepId?: string;

  /**
   * Valor de config json mantenido por la instancia.
   */
  @Property({
    fieldName: 'config_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  configJson?: unknown;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @Property({ columnType: 'int', nullable: true })
  ordinal?: number;

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
