import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'qa_lab', tableName: 'response_payloads' })
export class ResponsePayloads {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'test_case_result_id', type: 'uuid' }) // FK → qa_lab.test_case_results
  testCaseResultId!: string;

  @Property({ fieldName: 'request_payload_id', type: 'uuid', nullable: true }) // FK → qa_lab.request_payloads
  requestPayloadId?: string;

  @Property({ fieldName: 'http_status', columnType: 'int', nullable: true })
  httpStatus?: number;

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

  @Property({ fieldName: 'latency_ms', columnType: 'int', nullable: true })
  latencyMs?: number;

  @Property({ fieldName: 'size_bytes', columnType: 'int', nullable: true })
  sizeBytes?: number;

  @Property({
    fieldName: 'received_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  receivedAt?: Date;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
