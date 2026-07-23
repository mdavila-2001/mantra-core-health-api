import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'qa_lab', tableName: 'test_cases' })
export class TestCases {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'suite_id', type: 'uuid' }) // FK (destino no resuelto)
  suiteId!: string;

  @Property({ columnType: 'varchar' })
  code!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'case_type_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  caseTypeConceptId?: string;

  @Property({ fieldName: 'endpoint_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  endpointId?: string;

  @Property({
    fieldName: 'http_method_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  httpMethodConceptId?: string;

  @Property({ fieldName: 'request_path', columnType: 'text', nullable: true })
  requestPath?: string;

  @Property({
    fieldName: 'expected_http_status',
    columnType: 'int',
    nullable: true,
  })
  expectedHttpStatus?: number;

  @Property({
    fieldName: 'setup_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  setupJson?: unknown;

  @Property({
    fieldName: 'teardown_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  teardownJson?: unknown;

  @Property({ columnType: 'int', nullable: true })
  ordinal?: number;

  @Property({ fieldName: 'is_critical', type: 'boolean', nullable: true })
  isCritical?: boolean;

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
