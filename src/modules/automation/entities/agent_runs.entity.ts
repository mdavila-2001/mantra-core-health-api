import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'automation', tableName: 'agent_runs' })
export class AgentRuns {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'workflow_run_id', type: 'uuid', nullable: true }) // FK → automation.workflow_runs
  workflowRunId?: string;

  @Property({ fieldName: 'agent_id', type: 'uuid' }) // FK → automation.agents
  agentId!: string;

  @Property({ fieldName: 'agent_version_id', type: 'uuid' }) // FK → automation.agent_versions
  agentVersionId!: string;

  @Property({ fieldName: 'task_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  taskTypeConceptId!: string;

  @Property({
    fieldName: 'input_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  inputJson?: unknown;

  @Property({
    fieldName: 'output_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  outputJson?: unknown;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'input_tokens', columnType: 'int', nullable: true })
  inputTokens?: number;

  @Property({ fieldName: 'output_tokens', columnType: 'int', nullable: true })
  outputTokens?: number;

  @Property({ fieldName: 'cost_amount', columnType: 'numeric', nullable: true })
  costAmount?: string;

  @Property({ fieldName: 'latency_ms', columnType: 'int', nullable: true })
  latencyMs?: number;

  @Property({
    fieldName: 'started_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startedAt?: Date;

  @Property({
    fieldName: 'finished_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  finishedAt?: Date;

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
