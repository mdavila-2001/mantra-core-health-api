import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'system_ops', tableName: 'restore_test_runs' })
export class RestoreTestRuns {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'backup_policy_id', type: 'uuid' }) // FK → system_ops.backup_policies
  backupPolicyId!: string;

  @Property({
    fieldName: 'backup_reference',
    columnType: 'varchar',
    nullable: true,
  })
  backupReference?: string;

  @Property({ fieldName: 'outcome_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  outcomeConceptId!: string;

  @Property({
    fieldName: 'measured_rpo_seconds',
    columnType: 'int',
    nullable: true,
  })
  measuredRpoSeconds?: number;

  @Property({
    fieldName: 'measured_rto_seconds',
    columnType: 'int',
    nullable: true,
  })
  measuredRtoSeconds?: number;

  @Property({
    fieldName: 'integrity_check_passed',
    type: 'boolean',
    nullable: true,
  })
  integrityCheckPassed?: boolean;

  @Property({ fieldName: 'evidence_file_id', type: 'uuid', nullable: true }) // FK → common.files
  evidenceFileId?: string;

  @Property({ fieldName: 'started_at', columnType: 'timestamptz' })
  startedAt!: Date;

  @Property({
    fieldName: 'finished_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  finishedAt?: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
