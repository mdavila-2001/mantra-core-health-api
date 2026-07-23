import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'integration_contracts',
  tableName: 'integration_idempotency_records',
})
export class IntegrationIdempotencyRecords {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'integration_contract_id', type: 'uuid' }) // FK → integration_contracts.integration_contracts
  integrationContractId!: string;

  @Property({ fieldName: 'idempotency_key', columnType: 'varchar' })
  idempotencyKey!: string;

  @Property({ fieldName: 'operation_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  operationConceptId!: string;

  @Property({
    fieldName: 'request_hash',
    columnType: 'varchar',
    nullable: true,
  })
  requestHash?: string;

  @Property({
    fieldName: 'first_exchange_record_id',
    type: 'uuid',
    nullable: true,
  }) // FK (destino no resuelto)
  firstExchangeRecordId?: string;

  @Property({
    fieldName: 'response_reference',
    columnType: 'varchar',
    nullable: true,
  })
  responseReference?: string;

  @Property({
    fieldName: 'expires_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  expiresAt?: Date;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
