import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `integration_exchange_attempts`.
 */
@Entity({
  schema: 'integration_contracts',
  tableName: 'integration_exchange_attempts',
})
export class IntegrationExchangeAttempts {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a integration exchange record.
   */
  @Property({ fieldName: 'integration_exchange_record_id', type: 'uuid' }) // FK → integration_contracts.integration_exchange_records
  integrationExchangeRecordId!: string;

  /**
   * Valor de attempt number mantenido por la instancia.
   */
  @Property({ fieldName: 'attempt_number', columnType: 'int' })
  attemptNumber!: number;

  /**
   * Identificador asociado a endpoint.
   */
  @Property({ fieldName: 'endpoint_id', type: 'uuid', nullable: true }) // FK → integrations.integration_endpoints
  endpointId?: string;

  /**
   * Valor de started at mantenido por la instancia.
   */
  @Property({
    fieldName: 'started_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startedAt?: Date;

  /**
   * Valor de completed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  completedAt?: Date;

  /**
   * Valor de http status mantenido por la instancia.
   */
  @Property({ fieldName: 'http_status', columnType: 'int', nullable: true })
  httpStatus?: number;

  /**
   * Valor de provider error code mantenido por la instancia.
   */
  @Property({
    fieldName: 'provider_error_code',
    columnType: 'varchar',
    nullable: true,
  })
  providerErrorCode?: string;

  /**
   * Identificador asociado a retry decision concept.
   */
  @Property({
    fieldName: 'retry_decision_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  retryDecisionConceptId?: string;

  /**
   * Valor de next retry at mantenido por la instancia.
   */
  @Property({
    fieldName: 'next_retry_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  nextRetryAt?: Date;

  /**
   * Identificador asociado a trace.
   */
  @Property({ fieldName: 'trace_id', columnType: 'varchar', nullable: true })
  traceId?: string;

  /**
   * Identificador asociado a outcome concept.
   */
  @Property({ fieldName: 'outcome_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  outcomeConceptId!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
