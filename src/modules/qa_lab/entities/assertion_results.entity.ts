import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'qa_lab', tableName: 'assertion_results' })
export class AssertionResults {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'test_case_result_id', type: 'uuid' }) // FK → qa_lab.test_case_results
  testCaseResultId!: string;

  @Property({ fieldName: 'test_assertion_id', type: 'uuid' }) // FK → qa_lab.test_assertions
  testAssertionId!: string;

  @Property({ type: 'boolean' })
  passed!: boolean;

  @Property({ fieldName: 'actual_value', columnType: 'text', nullable: true })
  actualValue?: string;

  @Property({ columnType: 'text', nullable: true })
  message?: string;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
