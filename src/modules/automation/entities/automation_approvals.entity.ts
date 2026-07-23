import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'automation', tableName: 'automation_approvals' })
export class AutomationApprovals {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'agent_run_id', type: 'uuid' }) // FK → automation.agent_runs
  agentRunId!: string;

  @Property({ fieldName: 'agent_run_step_id', type: 'uuid', nullable: true }) // FK → automation.agent_run_steps
  agentRunStepId?: string;

  @Property({ fieldName: 'approval_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  approvalTypeConceptId!: string;

  @Property({
    fieldName: 'requested_action_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  requestedActionJson?: unknown;

  @Property({
    fieldName: 'target_resource_type',
    columnType: 'varchar',
    nullable: true,
  })
  targetResourceType?: string;

  @Property({ fieldName: 'target_ref_id', type: 'uuid', nullable: true })
  targetRefId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'decided_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  decidedByUserId?: string;

  @Property({
    fieldName: 'decided_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  decidedAt?: Date;

  @Property({ fieldName: 'decision_note', columnType: 'text', nullable: true })
  decisionNote?: string;

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
