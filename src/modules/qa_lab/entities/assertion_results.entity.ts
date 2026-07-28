import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `assertion_results`.
 */
@Entity({ schema: 'qa_lab', tableName: 'assertion_results' })
export class AssertionResults {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a test case result.
   */
  @Property({ fieldName: 'test_case_result_id', type: 'uuid' }) // FK → qa_lab.test_case_results
  testCaseResultId!: string;

  /**
   * Identificador asociado a test assertion.
   */
  @Property({ fieldName: 'test_assertion_id', type: 'uuid' }) // FK → qa_lab.test_assertions
  testAssertionId!: string;

  /**
   * Valor de passed mantenido por la instancia.
   */
  @Property({ type: 'boolean' })
  passed!: boolean;

  /**
   * Valor de actual value mantenido por la instancia.
   */
  @Property({ fieldName: 'actual_value', columnType: 'text', nullable: true })
  actualValue?: string;

  /**
   * Valor de message mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  message?: string;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  /**
   * Identificador asociado a recorded by user.
   */
  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
