import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'qa_lab', tableName: 'test_assertions' })
export class TestAssertions {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'test_case_id', type: 'uuid' }) // FK → qa_lab.test_cases
  testCaseId!: string;

  @Property({ fieldName: 'assertion_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  assertionTypeConceptId!: string;

  @Property({ fieldName: 'json_path', columnType: 'varchar', nullable: true })
  jsonPath?: string;

  @Property({ fieldName: 'operator_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  operatorConceptId?: string;

  @Property({ fieldName: 'expected_value', columnType: 'text', nullable: true })
  expectedValue?: string;

  @Property({ columnType: 'numeric', nullable: true })
  tolerance?: string;

  @Property({ columnType: 'int', nullable: true })
  ordinal?: number;

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
