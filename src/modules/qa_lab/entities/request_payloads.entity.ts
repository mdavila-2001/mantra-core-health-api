import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'qa_lab', tableName: 'request_payloads' })
export class RequestPayloads {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'test_case_result_id', type: 'uuid' }) // FK → qa_lab.test_case_results
  testCaseResultId!: string;

  @Property({ fieldName: 'direction_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  directionConceptId!: string;

  @Property({ fieldName: 'sequence_no', columnType: 'int', nullable: true })
  sequenceNo?: number;

  @Property({
    fieldName: 'http_method_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  httpMethodConceptId?: string;

  @Property({ fieldName: 'target_url', columnType: 'text', nullable: true })
  targetUrl?: string;

  @Property({
    fieldName: 'headers_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  headersJson?: unknown;

  @Property({ fieldName: 'body_json', type: 'json', columnType: 'jsonb' })
  bodyJson!: unknown;

  @Property({ fieldName: 'body_hash', columnType: 'varchar', nullable: true })
  bodyHash?: string;

  @Property({ fieldName: 'size_bytes', columnType: 'int', nullable: true })
  sizeBytes?: number;

  @Property({ fieldName: 'sent_at', columnType: 'timestamptz', nullable: true })
  sentAt?: Date;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
