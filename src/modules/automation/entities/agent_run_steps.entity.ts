import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'automation', tableName: 'agent_run_steps' })
export class AgentRunSteps {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'agent_run_id', type: 'uuid' }) // FK → automation.agent_runs
  agentRunId!: string;

  @Property({ fieldName: 'sequence_no', columnType: 'int' })
  sequenceNo!: number;

  @Property({ fieldName: 'step_kind_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stepKindConceptId!: string;

  @Property({ fieldName: 'agent_tool_id', type: 'uuid', nullable: true }) // FK → automation.agent_tools
  agentToolId?: string;

  @Property({ fieldName: 'thought_text', columnType: 'text', nullable: true })
  thoughtText?: string;

  @Property({
    fieldName: 'tool_input_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  toolInputJson?: unknown;

  @Property({
    fieldName: 'tool_output_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  toolOutputJson?: unknown;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'error_text', columnType: 'text', nullable: true })
  errorText?: string;

  @Property({
    fieldName: 'occurred_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  occurredAt?: Date;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
