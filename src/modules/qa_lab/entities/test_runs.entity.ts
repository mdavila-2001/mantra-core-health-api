import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'qa_lab', tableName: 'test_runs' })
export class TestRuns {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'suite_id', type: 'uuid' }) // FK → qa_lab.test_suites
  suiteId!: string;

  @Property({ fieldName: 'environment_id', type: 'uuid' }) // FK → qa_lab.test_environments
  environmentId!: string;

  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  @Property({ fieldName: 'run_number', columnType: 'varchar' })
  runNumber!: string;

  @Property({ fieldName: 'trigger_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  triggerConceptId!: string;

  @Property({ fieldName: 'triggered_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  triggeredByUserId?: string;

  @Property({ fieldName: 'git_ref', columnType: 'varchar', nullable: true })
  gitRef?: string;

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

  @Property({ fieldName: 'total_cases', columnType: 'int', nullable: true })
  totalCases?: number;

  @Property({ fieldName: 'total_passed', columnType: 'int', nullable: true })
  totalPassed?: number;

  @Property({ fieldName: 'total_failed', columnType: 'int', nullable: true })
  totalFailed?: number;

  @Property({ fieldName: 'total_skipped', columnType: 'int', nullable: true })
  totalSkipped?: number;

  @Property({ fieldName: 'duration_ms', columnType: 'int', nullable: true })
  durationMs?: number;

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
