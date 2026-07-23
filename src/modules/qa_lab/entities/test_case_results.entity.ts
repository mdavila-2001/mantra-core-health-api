import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'qa_lab', tableName: 'test_case_results' })
export class TestCaseResults {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'test_run_id', type: 'uuid' }) // FK → qa_lab.test_runs
  testRunId!: string;

  @Property({ fieldName: 'test_case_id', type: 'uuid' }) // FK → qa_lab.test_cases
  testCaseId!: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'duration_ms', columnType: 'int', nullable: true })
  durationMs?: number;

  @Property({
    fieldName: 'assertions_total',
    columnType: 'int',
    nullable: true,
  })
  assertionsTotal?: number;

  @Property({
    fieldName: 'assertions_passed',
    columnType: 'int',
    nullable: true,
  })
  assertionsPassed?: number;

  @Property({
    fieldName: 'assertions_failed',
    columnType: 'int',
    nullable: true,
  })
  assertionsFailed?: number;

  @Property({
    fieldName: 'error_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  errorTypeConceptId?: string;

  @Property({ fieldName: 'error_text', columnType: 'text', nullable: true })
  errorText?: string;

  @Property({ fieldName: 'stack_trace', columnType: 'text', nullable: true })
  stackTrace?: string;

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
