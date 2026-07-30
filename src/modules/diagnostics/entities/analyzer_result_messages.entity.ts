import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `analyzer_result_messages`.
 */
@Entity({ schema: 'diagnostics', tableName: 'analyzer_result_messages' })
export class AnalyzerResultMessages {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a analyzer run.
   */
  @Property({ fieldName: 'analyzer_run_id', type: 'uuid' }) // FK → diagnostics.analyzer_runs
  analyzerRunId!: string;

  /**
   * Identificador asociado a laboratory work order test.
   */
  @Property({
    fieldName: 'laboratory_work_order_test_id',
    type: 'uuid',
    nullable: true,
  }) // FK → diagnostics.laboratory_work_order_tests
  laboratoryWorkOrderTestId?: string;

  /**
   * Valor de received at mantenido por la instancia.
   */
  @Property({ fieldName: 'received_at', columnType: 'timestamptz' })
  receivedAt!: Date;

  /**
   * Identificador asociado a message format concept.
   */
  @Property({ fieldName: 'message_format_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  messageFormatConceptId!: string;

  /**
   * Identificador asociado a message control.
   */
  @Property({
    fieldName: 'message_control_id',
    columnType: 'varchar',
    nullable: true,
  })
  messageControlId?: string;

  /**
   * Identificador asociado a raw message file.
   */
  @Property({ fieldName: 'raw_message_file_id', type: 'uuid', nullable: true }) // FK → common.files
  rawMessageFileId?: string;

  /**
   * Valor de payload hash mantenido por la instancia.
   */
  @Property({ fieldName: 'payload_hash', columnType: 'varchar' })
  payloadHash!: string;

  /**
   * Identificador asociado a validation status concept.
   */
  @Property({ fieldName: 'validation_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  validationStatusConceptId!: string;

  /**
   * Identificador asociado a mapped observation.
   */
  @Property({
    fieldName: 'mapped_observation_id',
    type: 'uuid',
    nullable: true,
  }) // FK → clinical.observations
  mappedObservationId?: string;

  /**
   * Valor de processing error json mantenido por la instancia.
   */
  @Property({
    fieldName: 'processing_error_json',
    type: 'json',
    columnType: 'jsonb',
    nullable: true,
  })
  processingErrorJson?: unknown;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
