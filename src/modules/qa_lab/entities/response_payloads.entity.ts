import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `response_payloads`.
 */
@Entity({ schema: 'qa_lab', tableName: 'response_payloads' })
export class ResponsePayloads {
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
   * Identificador asociado a request payload.
   */
  @Property({ fieldName: 'request_payload_id', type: 'uuid', nullable: true }) // FK → qa_lab.request_payloads
  requestPayloadId?: string;

  /**
   * Valor de http status mantenido por la instancia.
   */
  @Property({ fieldName: 'http_status', columnType: 'int', nullable: true })
  httpStatus?: number;

  /**
   * Valor de headers json mantenido por la instancia.
   */
  @Property({
    fieldName: 'headers_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  headersJson?: unknown;

  /**
   * Valor de body json mantenido por la instancia.
   */
  @Property({ fieldName: 'body_json', type: 'json', columnType: 'jsonb' })
  bodyJson!: unknown;

  /**
   * Valor de body hash mantenido por la instancia.
   */
  @Property({ fieldName: 'body_hash', columnType: 'varchar', nullable: true })
  bodyHash?: string;

  /**
   * Valor de latency ms mantenido por la instancia.
   */
  @Property({ fieldName: 'latency_ms', columnType: 'int', nullable: true })
  latencyMs?: number;

  /**
   * Valor de size bytes mantenido por la instancia.
   */
  @Property({ fieldName: 'size_bytes', columnType: 'int', nullable: true })
  sizeBytes?: number;

  /**
   * Valor de received at mantenido por la instancia.
   */
  @Property({
    fieldName: 'received_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  receivedAt?: Date;

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
