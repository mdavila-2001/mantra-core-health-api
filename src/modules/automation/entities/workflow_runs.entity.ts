import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'automation', tableName: 'workflow_runs' })
export class WorkflowRuns {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'workflow_id', type: 'uuid' }) // FK → automation.workflows
  workflowId!: string;

  @Property({ fieldName: 'trigger_id', type: 'uuid', nullable: true }) // FK → automation.automation_triggers
  triggerId?: string;

  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  @Property({ fieldName: 'run_number', columnType: 'varchar' })
  runNumber!: string;

  @Property({ fieldName: 'trigger_source_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  triggerSourceConceptId!: string;

  @Property({
    fieldName: 'input_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  inputJson?: unknown;

  @Property({
    fieldName: 'context_ref_type',
    columnType: 'varchar',
    nullable: true,
  })
  contextRefType?: string;

  @Property({ fieldName: 'context_ref_id', type: 'uuid', nullable: true })
  contextRefId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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

  @Property({
    fieldName: 'total_cost_amount',
    columnType: 'numeric',
    nullable: true,
  })
  totalCostAmount?: string;

  @Property({ fieldName: 'error_text', columnType: 'text', nullable: true })
  errorText?: string;

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
