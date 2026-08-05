import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `integration_sync_cursors`.
 */
@Entity({
  schema: 'integration_contracts',
  tableName: 'integration_sync_cursors',
})
export class IntegrationSyncCursors {
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
   * Valor de cursor scope mantenido por la instancia.
   */
  @Property({ fieldName: 'cursor_scope', columnType: 'varchar' })
  cursorScope!: string;

  /**
   * Valor de cursor value mantenido por la instancia.
   */
  @Property({ fieldName: 'cursor_value', columnType: 'text' })
  cursorValue!: string;

  /**
   * Valor de watermark at mantenido por la instancia.
   */
  @Property({
    fieldName: 'watermark_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  watermarkAt?: Date;

  /**
   * Identificador asociado a last successful exchange.
   */
  @Property({
    fieldName: 'last_successful_exchange_id',
    type: 'uuid',
    nullable: true,
  }) // FK → integration_contracts.integration_exchange_records
  lastSuccessfulExchangeId?: string;

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

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
