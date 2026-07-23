import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'platform_ops', tableName: 'runbook_executions' })
export class RunbookExecutions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'runbook_version_id', type: 'uuid' }) // FK → platform_ops.runbook_versions
  runbookVersionId!: string;

  @Property({ fieldName: 'health_incident_id', type: 'uuid', nullable: true }) // FK → platform_ops.health_incidents
  healthIncidentId?: string;

  @Property({ fieldName: 'change_request_id', type: 'uuid', nullable: true }) // FK → platform_ops.change_requests
  changeRequestId?: string;

  @Property({ fieldName: 'execution_mode_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  executionModeConceptId!: string;

  @Property({ fieldName: 'started_at', columnType: 'timestamptz' })
  startedAt!: Date;

  @Property({
    fieldName: 'ended_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  endedAt?: Date;

  @Property({ fieldName: 'result_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  resultConceptId!: string;

  @Property({ fieldName: 'initiated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  initiatedByUserId?: string;

  @Property({
    fieldName: 'execution_log_uri',
    columnType: 'varchar',
    nullable: true,
  })
  executionLogUri?: string;

  @Property({
    fieldName: 'output_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  outputJson?: unknown;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
