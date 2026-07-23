import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'integration_contracts',
  tableName: 'integration_exchange_records',
})
export class IntegrationExchangeRecords {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'integration_contract_version_id', type: 'uuid' }) // FK → integration_contracts.integration_contract_versions
  integrationContractVersionId!: string;

  @Property({ fieldName: 'direction_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  directionConceptId!: string;

  @Property({ fieldName: 'message_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  messageTypeConceptId!: string;

  @Property({
    fieldName: 'business_identifier',
    columnType: 'varchar',
    nullable: true,
  })
  businessIdentifier?: string;

  @Property({
    fieldName: 'idempotency_key',
    columnType: 'varchar',
    nullable: true,
  })
  idempotencyKey?: string;

  @Property({ fieldName: 'correlation_id', type: 'uuid', nullable: true })
  correlationId?: string;

  @Property({
    fieldName: 'subject_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  subjectTypeConceptId?: string;

  @Property({ fieldName: 'subject_entity_id', type: 'uuid', nullable: true })
  subjectEntityId?: string;

  @Property({
    fieldName: 'request_hash',
    columnType: 'varchar',
    nullable: true,
  })
  requestHash?: string;

  @Property({
    fieldName: 'response_hash',
    columnType: 'varchar',
    nullable: true,
  })
  responseHash?: string;

  @Property({ fieldName: 'payload_file_id', type: 'uuid', nullable: true }) // FK → common.files
  payloadFileId?: string;

  @Property({
    fieldName: 'received_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  receivedAt?: Date;

  @Property({
    fieldName: 'completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  completedAt?: Date;

  @Property({ fieldName: 'outcome_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  outcomeConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
