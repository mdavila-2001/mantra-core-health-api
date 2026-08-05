import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `integration_idempotency_records`.
 */
@Entity({
  schema: 'integration_contracts',
  tableName: 'integration_idempotency_records',
})
export class IntegrationIdempotencyRecords {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a integration contract.
   */
  @Property({ fieldName: 'integration_contract_id', type: 'uuid' }) // FK → integration_contracts.integration_contracts
  integrationContractId!: string;

  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  @Property({ fieldName: 'idempotency_key', columnType: 'varchar' })
  idempotencyKey!: string;

  /**
   * Identificador asociado a operation concept.
   */
  @Property({ fieldName: 'operation_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  operationConceptId!: string;

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
   * Identificador asociado a first exchange record.
   */
  @Property({
    fieldName: 'first_exchange_record_id',
    type: 'uuid',
    nullable: true,
  }) // FK → integration_contracts.integration_exchange_records
  firstExchangeRecordId?: string;

  /**
   * Valor de response reference mantenido por la instancia.
   */
  @Property({
    fieldName: 'response_reference',
    columnType: 'varchar',
    nullable: true,
  })
  responseReference?: string;

  /**
   * Valor de expires at mantenido por la instancia.
   */
  @Property({
    fieldName: 'expires_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  expiresAt?: Date;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
