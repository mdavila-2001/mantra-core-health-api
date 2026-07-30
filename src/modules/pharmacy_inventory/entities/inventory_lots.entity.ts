import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `inventory_lots`.
 */
@Entity({ schema: 'pharmacy_inventory', tableName: 'inventory_lots' })
export class InventoryLots {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a pharmacy product.
   */
  @Property({ fieldName: 'pharmacy_product_id', type: 'uuid' }) // FK → pharmacy.pharmacy_products
  pharmacyProductId!: string;

  /**
   * Valor de lot number mantenido por la instancia.
   */
  @Property({ fieldName: 'lot_number', columnType: 'varchar' })
  lotNumber!: string;

  /**
   * Valor de manufacturer lot number mantenido por la instancia.
   */
  @Property({
    fieldName: 'manufacturer_lot_number',
    columnType: 'varchar',
    nullable: true,
  })
  manufacturerLotNumber?: string;

  /**
   * Valor de manufactured at mantenido por la instancia.
   */
  @Property({
    fieldName: 'manufactured_at',
    columnType: 'date',
    nullable: true,
  })
  manufacturedAt?: Date;

  /**
   * Valor de expires at mantenido por la instancia.
   */
  @Property({ fieldName: 'expires_at', columnType: 'date', nullable: true })
  expiresAt?: Date;

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
   * Identificador asociado a quarantine status concept.
   */
  @Property({
    fieldName: 'quarantine_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  quarantineStatusConceptId?: string;

  /**
   * Identificador asociado a recall status concept.
   */
  @Property({
    fieldName: 'recall_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  recallStatusConceptId?: string;

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
