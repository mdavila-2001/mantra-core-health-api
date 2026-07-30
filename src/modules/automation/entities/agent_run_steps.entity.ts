import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `agent_run_steps`.
 */
@Entity({ schema: 'automation', tableName: 'agent_run_steps' })
export class AgentRunSteps {
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
   * Valor de sequence no mantenido por la instancia.
   */
  @Property({ fieldName: 'sequence_no', columnType: 'int' })
  sequenceNo!: number;

  /**
   * Identificador asociado a step kind concept.
   */
  @Property({ fieldName: 'step_kind_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stepKindConceptId!: string;

  /**
   * Identificador asociado a agent tool.
   */
  @Property({ fieldName: 'agent_tool_id', type: 'uuid', nullable: true }) // FK → automation.agent_tools
  agentToolId?: string;

  /**
   * Valor de thought text mantenido por la instancia.
   */
  @Property({ fieldName: 'thought_text', columnType: 'text', nullable: true })
  thoughtText?: string;

  /**
   * Valor de tool input json mantenido por la instancia.
   */
  @Property({
    fieldName: 'tool_input_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  toolInputJson?: unknown;

  /**
   * Valor de tool output json mantenido por la instancia.
   */
  @Property({
    fieldName: 'tool_output_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  toolOutputJson?: unknown;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de error text mantenido por la instancia.
   */
  @Property({ fieldName: 'error_text', columnType: 'text', nullable: true })
  errorText?: string;

  /**
   * Valor de occurred at mantenido por la instancia.
   */
  @Property({
    fieldName: 'occurred_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  occurredAt?: Date;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  /**
   * Identificador asociado a recorded by user.
   */
  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
