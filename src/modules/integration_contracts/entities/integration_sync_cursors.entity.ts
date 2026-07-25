import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'integration_contracts',
  tableName: 'integration_sync_cursors',
})
export class IntegrationSyncCursors {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'integration_contract_id', type: 'uuid' }) // FK → integration_contracts.integration_contracts
  integrationContractId!: string;

  @Property({ fieldName: 'cursor_scope', columnType: 'varchar' })
  cursorScope!: string;

  @Property({ fieldName: 'cursor_value', columnType: 'text' })
  cursorValue!: string;

  @Property({
    fieldName: 'watermark_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  watermarkAt?: Date;

  @Property({
    fieldName: 'last_successful_exchange_id',
    type: 'uuid',
    nullable: true,
  }) // FK → integration_contracts.integration_exchange_records
  lastSuccessfulExchangeId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
