import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `integration_exchange_records`.
 */
@Entity({
  schema: 'integration_contracts',
  tableName: 'integration_exchange_records',
})
export class IntegrationExchangeRecords {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a integration contract version.
   */
  @Property({ fieldName: 'integration_contract_version_id', type: 'uuid' }) // FK → integration_contracts.integration_contract_versions
  integrationContractVersionId!: string;

  /**
   * Identificador asociado a direction concept.
   */
  @Property({ fieldName: 'direction_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  directionConceptId!: string;

  /**
   * Identificador asociado a message type concept.
   */
  @Property({ fieldName: 'message_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  messageTypeConceptId!: string;

  /**
   * Valor de business identifier mantenido por la instancia.
   */
  @Property({
    fieldName: 'business_identifier',
    columnType: 'varchar',
    nullable: true,
  })
  businessIdentifier?: string;

  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  @Property({
    fieldName: 'idempotency_key',
    columnType: 'varchar',
    nullable: true,
  })
  idempotencyKey?: string;

  /**
   * Identificador asociado a correlation.
   */
  @Property({ fieldName: 'correlation_id', type: 'uuid', nullable: true })
  correlationId?: string;

  /**
   * Identificador asociado a subject type concept.
   */
  @Property({
    fieldName: 'subject_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  subjectTypeConceptId?: string;

  /**
   * Identificador asociado a subject entity.
   */
  @Property({ fieldName: 'subject_entity_id', type: 'uuid', nullable: true })
  subjectEntityId?: string;

  /**
   * Valor de request hash mantenido por la instancia.
   */
  @Property({
    fieldName: 'request_hash',
    columnType: 'varchar',
    nullable: true,
  })
  requestHash?: string;

  /**
   * Valor de response hash mantenido por la instancia.
   */
  @Property({
    fieldName: 'response_hash',
    columnType: 'varchar',
    nullable: true,
  })
  responseHash?: string;

  /**
   * Identificador asociado a payload file.
   */
  @Property({ fieldName: 'payload_file_id', type: 'uuid', nullable: true }) // FK → common.files
  payloadFileId?: string;

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
   * Valor de completed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  completedAt?: Date;

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
