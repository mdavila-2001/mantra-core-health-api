import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `conversion_event_delivery_attempts`.
 */
@Entity({ schema: 'ads', tableName: 'conversion_event_delivery_attempts' })
export class ConversionEventDeliveryAttempts {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a server conversion event.
   */
  @Property({ fieldName: 'server_conversion_event_id', type: 'uuid' }) // FK → ads.server_conversion_events
  serverConversionEventId!: string;

  /**
   * Identificador asociado a platform connection.
   */
  @Property({ fieldName: 'platform_connection_id', type: 'uuid' }) // FK → ads.ad_platform_connections
  platformConnectionId!: string;

  /**
   * Valor de attempt number mantenido por la instancia.
   */
  @Property({ fieldName: 'attempt_number', columnType: 'int' })
  attemptNumber!: number;

  /**
   * Valor de attempted at mantenido por la instancia.
   */
  @Property({ fieldName: 'attempted_at', columnType: 'timestamptz' })
  attemptedAt!: Date;

  /**
   * Identificador asociado a result concept.
   */
  @Property({ fieldName: 'result_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  resultConceptId!: string;

  /**
   * Valor de http status mantenido por la instancia.
   */
  @Property({ fieldName: 'http_status', columnType: 'int', nullable: true })
  httpStatus?: number;

  /**
   * Identificador asociado a external trace.
   */
  @Property({
    fieldName: 'external_trace_id',
    columnType: 'varchar',
    nullable: true,
  })
  externalTraceId?: string;

  /**
   * Valor de response json redacted mantenido por la instancia.
   */
  @Property({
    fieldName: 'response_json_redacted',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  responseJsonRedacted?: unknown;

  /**
   * Valor de retry at mantenido por la instancia.
   */
  @Property({
    fieldName: 'retry_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  retryAt?: Date;

  /**
   * Valor de error code mantenido por la instancia.
   */
  @Property({ fieldName: 'error_code', columnType: 'varchar', nullable: true })
  errorCode?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
