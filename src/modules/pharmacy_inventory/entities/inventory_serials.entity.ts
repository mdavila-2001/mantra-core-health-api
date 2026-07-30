import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `inventory_serials`.
 */
@Entity({ schema: 'pharmacy_inventory', tableName: 'inventory_serials' })
export class InventorySerials {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a inventory lot.
   */
  @Property({ fieldName: 'inventory_lot_id', type: 'uuid' }) // FK → pharmacy_inventory.inventory_lots
  inventoryLotId!: string;

  /**
   * Valor de serial number mantenido por la instancia.
   */
  @Property({ fieldName: 'serial_number', columnType: 'varchar' })
  serialNumber!: string;

  /**
   * Valor de verification identifier mantenido por la instancia.
   */
  @Property({
    fieldName: 'verification_identifier',
    columnType: 'varchar',
    nullable: true,
  })
  verificationIdentifier?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Identificador asociado a current inventory location.
   */
  @Property({
    fieldName: 'current_inventory_location_id',
    type: 'uuid',
    nullable: true,
  }) // FK → pharmacy_inventory.inventory_locations
  currentInventoryLocationId?: string;

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
