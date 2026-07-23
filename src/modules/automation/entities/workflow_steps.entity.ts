import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'automation', tableName: 'workflow_steps' })
export class WorkflowSteps {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'workflow_id', type: 'uuid' }) // FK → automation.workflows
  workflowId!: string;

  @Property({ fieldName: 'step_code', columnType: 'varchar' })
  stepCode!: string;

  @Property({ fieldName: 'step_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stepTypeConceptId!: string;

  @Property({ fieldName: 'agent_id', type: 'uuid', nullable: true }) // FK → automation.agents
  agentId?: string;

  @Property({ fieldName: 'agent_tool_id', type: 'uuid', nullable: true }) // FK → automation.agent_tools
  agentToolId?: string;

  @Property({ fieldName: 'on_success_step_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  onSuccessStepId?: string;

  @Property({ fieldName: 'on_failure_step_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  onFailureStepId?: string;

  @Property({
    fieldName: 'config_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  configJson?: unknown;

  @Property({ columnType: 'int', nullable: true })
  ordinal?: number;

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
