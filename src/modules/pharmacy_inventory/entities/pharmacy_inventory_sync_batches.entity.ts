import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `pharmacy_inventory_sync_batches`.
 */
@Entity({
  schema: 'pharmacy_inventory',
  tableName: 'pharmacy_inventory_sync_batches',
})
export class PharmacyInventorySyncBatches {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a pharmacy integration connection.
   */
  @Property({ fieldName: 'pharmacy_integration_connection_id', type: 'uuid' }) // FK → pharmacy.pharmacy_integration_connections
  pharmacyIntegrationConnectionId!: string;

  /**
   * Identificador asociado a direction concept.
   */
  @Property({ fieldName: 'direction_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  directionConceptId!: string;

  /**
   * Valor de source batch identifier mantenido por la instancia.
   */
  @Property({ fieldName: 'source_batch_identifier', columnType: 'varchar' })
  sourceBatchIdentifier!: string;

  /**
   * Valor de sync cursor before mantenido por la instancia.
   */
  @Property({
    fieldName: 'sync_cursor_before',
    columnType: 'varchar',
    nullable: true,
  })
  syncCursorBefore?: string;

  /**
   * Valor de sync cursor after mantenido por la instancia.
   */
  @Property({
    fieldName: 'sync_cursor_after',
    columnType: 'varchar',
    nullable: true,
  })
  syncCursorAfter?: string;

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
   * Valor de item count mantenido por la instancia.
   */
  @Property({ fieldName: 'item_count', columnType: 'int', nullable: true })
  itemCount?: number;

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
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
