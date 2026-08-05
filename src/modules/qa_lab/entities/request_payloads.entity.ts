import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `request_payloads`.
 */
@Entity({ schema: 'qa_lab', tableName: 'request_payloads' })
export class RequestPayloads {
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
   * Identificador asociado a direction concept.
   */
  @Property({ fieldName: 'direction_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  directionConceptId!: string;

  /**
   * Valor de sequence no mantenido por la instancia.
   */
  @Property({ fieldName: 'sequence_no', columnType: 'int', nullable: true })
  sequenceNo?: number;

  /**
   * Identificador asociado a http method concept.
   */
  @Property({
    fieldName: 'http_method_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  httpMethodConceptId?: string;

  /**
   * Valor de target url mantenido por la instancia.
   */
  @Property({ fieldName: 'target_url', columnType: 'text', nullable: true })
  targetUrl?: string;

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
   * Valor de size bytes mantenido por la instancia.
   */
  @Property({ fieldName: 'size_bytes', columnType: 'int', nullable: true })
  sizeBytes?: number;

  /**
   * Valor de sent at mantenido por la instancia.
   */
  @Property({ fieldName: 'sent_at', columnType: 'timestamptz', nullable: true })
  sentAt?: Date;

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
