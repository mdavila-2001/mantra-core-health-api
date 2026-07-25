import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'ads', tableName: 'conversion_event_delivery_attempts' })
export class ConversionEventDeliveryAttempts {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'server_conversion_event_id', type: 'uuid' }) // FK → ads.server_conversion_events
  serverConversionEventId!: string;

  @Property({ fieldName: 'platform_connection_id', type: 'uuid' }) // FK → ads.ad_platform_connections
  platformConnectionId!: string;

  @Property({ fieldName: 'attempt_number', columnType: 'int' })
  attemptNumber!: number;

  @Property({ fieldName: 'attempted_at', columnType: 'timestamptz' })
  attemptedAt!: Date;

  @Property({ fieldName: 'result_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  resultConceptId!: string;

  @Property({ fieldName: 'http_status', columnType: 'int', nullable: true })
  httpStatus?: number;

  @Property({
    fieldName: 'external_trace_id',
    columnType: 'varchar',
    nullable: true,
  })
  externalTraceId?: string;

  @Property({
    fieldName: 'response_json_redacted',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  responseJsonRedacted?: unknown;

  @Property({
    fieldName: 'retry_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  retryAt?: Date;

  @Property({ fieldName: 'error_code', columnType: 'varchar', nullable: true })
  errorCode?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
