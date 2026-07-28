import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `agent_runs`.
 */
@Entity({ schema: 'automation', tableName: 'agent_runs' })
export class AgentRuns {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a workflow run.
   */
  @Property({ fieldName: 'workflow_run_id', type: 'uuid', nullable: true }) // FK → automation.workflow_runs
  workflowRunId?: string;

  /**
   * Identificador asociado a agent.
   */
  @Property({ fieldName: 'agent_id', type: 'uuid' }) // FK → automation.agents
  agentId!: string;

  /**
   * Identificador asociado a agent version.
   */
  @Property({ fieldName: 'agent_version_id', type: 'uuid' }) // FK → automation.agent_versions
  agentVersionId!: string;

  /**
   * Identificador asociado a task type concept.
   */
  @Property({ fieldName: 'task_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  taskTypeConceptId!: string;

  /**
   * Valor de input json mantenido por la instancia.
   */
  @Property({
    fieldName: 'input_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  inputJson?: unknown;

  /**
   * Valor de output json mantenido por la instancia.
   */
  @Property({
    fieldName: 'output_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  outputJson?: unknown;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de input tokens mantenido por la instancia.
   */
  @Property({ fieldName: 'input_tokens', columnType: 'int', nullable: true })
  inputTokens?: number;

  /**
   * Valor de output tokens mantenido por la instancia.
   */
  @Property({ fieldName: 'output_tokens', columnType: 'int', nullable: true })
  outputTokens?: number;

  /**
   * Valor de cost amount mantenido por la instancia.
   */
  @Property({ fieldName: 'cost_amount', columnType: 'numeric', nullable: true })
  costAmount?: string;

  /**
   * Valor de latency ms mantenido por la instancia.
   */
  @Property({ fieldName: 'latency_ms', columnType: 'int', nullable: true })
  latencyMs?: number;

  /**
   * Valor de started at mantenido por la instancia.
   */
  @Property({
    fieldName: 'started_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startedAt?: Date;

  /**
   * Valor de finished at mantenido por la instancia.
   */
  @Property({
    fieldName: 'finished_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  finishedAt?: Date;

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
