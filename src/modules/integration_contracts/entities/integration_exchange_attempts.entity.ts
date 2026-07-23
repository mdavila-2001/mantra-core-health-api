import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'integration_contracts',
  tableName: 'integration_exchange_attempts',
})
export class IntegrationExchangeAttempts {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'integration_exchange_record_id', type: 'uuid' }) // FK → integration_contracts.integration_exchange_records
  integrationExchangeRecordId!: string;

  @Property({ fieldName: 'attempt_number', columnType: 'int' })
  attemptNumber!: number;

  @Property({ fieldName: 'endpoint_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  endpointId?: string;

  @Property({
    fieldName: 'started_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startedAt?: Date;

  @Property({
    fieldName: 'completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  completedAt?: Date;

  @Property({ fieldName: 'http_status', columnType: 'int', nullable: true })
  httpStatus?: number;

  @Property({
    fieldName: 'provider_error_code',
    columnType: 'varchar',
    nullable: true,
  })
  providerErrorCode?: string;

  @Property({
    fieldName: 'retry_decision_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  retryDecisionConceptId?: string;

  @Property({
    fieldName: 'next_retry_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  nextRetryAt?: Date;

  @Property({ fieldName: 'trace_id', columnType: 'varchar', nullable: true })
  traceId?: string;

  @Property({ fieldName: 'outcome_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  outcomeConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
