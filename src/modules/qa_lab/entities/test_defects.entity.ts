import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'qa_lab', tableName: 'test_defects' })
export class TestDefects {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'tenant_id', type: 'uuid', nullable: true }) // FK → directory.tenants
  tenantId?: string;

  @Property({ fieldName: 'test_case_id', type: 'uuid' }) // FK → qa_lab.test_cases
  testCaseId!: string;

  @Property({ fieldName: 'test_case_result_id', type: 'uuid', nullable: true }) // FK → qa_lab.test_case_results
  testCaseResultId?: string;

  @Property({ fieldName: 'defect_number', columnType: 'varchar' })
  defectNumber!: string;

  @Property({ fieldName: 'defect_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  defectTypeConceptId!: string;

  @Property({ fieldName: 'severity_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  severityConceptId!: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'is_flaky', type: 'boolean', nullable: true })
  isFlaky?: boolean;

  @Property({
    fieldName: 'failure_signature_hash',
    columnType: 'varchar',
    nullable: true,
  })
  failureSignatureHash?: string;

  @Property({
    fieldName: 'occurrences_count',
    columnType: 'int',
    nullable: true,
  })
  occurrencesCount?: number;

  @Property({
    fieldName: 'first_seen_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  firstSeenAt?: Date;

  @Property({
    fieldName: 'last_seen_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  lastSeenAt?: Date;

  @Property({
    fieldName: 'external_issue_ref',
    columnType: 'varchar',
    nullable: true,
  })
  externalIssueRef?: string;

  @Property({ fieldName: 'assigned_to_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  assignedToUserId?: string;

  @Property({ columnType: 'varchar' })
  title!: string;

  @Property({ columnType: 'text', nullable: true })
  description?: string;

  @Property({ fieldName: 'state_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  stateConceptId!: string;

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
