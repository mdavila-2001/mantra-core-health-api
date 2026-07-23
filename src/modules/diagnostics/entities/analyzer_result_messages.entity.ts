import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'diagnostics', tableName: 'analyzer_result_messages' })
export class AnalyzerResultMessages {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'analyzer_run_id', type: 'uuid' }) // FK → diagnostics.analyzer_runs
  analyzerRunId!: string;

  @Property({
    fieldName: 'laboratory_work_order_test_id',
    type: 'uuid',
    nullable: true,
  }) // FK → diagnostics.laboratory_work_order_tests
  laboratoryWorkOrderTestId?: string;

  @Property({ fieldName: 'received_at', columnType: 'timestamptz' })
  receivedAt!: Date;

  @Property({ fieldName: 'message_format_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  messageFormatConceptId!: string;

  @Property({
    fieldName: 'message_control_id',
    columnType: 'varchar',
    nullable: true,
  })
  messageControlId?: string;

  @Property({ fieldName: 'raw_message_file_id', type: 'uuid', nullable: true }) // FK → common.files
  rawMessageFileId?: string;

  @Property({ fieldName: 'payload_hash', columnType: 'varchar' })
  payloadHash!: string;

  @Property({ fieldName: 'validation_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  validationStatusConceptId!: string;

  @Property({
    fieldName: 'mapped_observation_id',
    type: 'uuid',
    nullable: true,
  }) // FK → clinical.observations
  mappedObservationId?: string;

  @Property({
    fieldName: 'processing_error_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  processingErrorJson?: unknown;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
