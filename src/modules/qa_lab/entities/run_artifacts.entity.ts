import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'qa_lab', tableName: 'run_artifacts' })
export class RunArtifacts {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'test_run_id', type: 'uuid' }) // FK → qa_lab.test_runs
  testRunId!: string;

  @Property({ fieldName: 'test_case_result_id', type: 'uuid', nullable: true }) // FK → qa_lab.test_case_results
  testCaseResultId?: string;

  @Property({ fieldName: 'artifact_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  artifactTypeConceptId!: string;

  @Property({ fieldName: 'file_id', type: 'uuid', nullable: true }) // FK → common.files
  fileId?: string;

  @Property({ columnType: 'varchar', nullable: true })
  label?: string;

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
