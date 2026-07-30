import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `inventory_items`.
 */
@Entity({ schema: 'practice', tableName: 'inventory_items' })
export class InventoryItems {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a practice.
   */
  @Property({ fieldName: 'practice_id', type: 'uuid' }) // FK → practice.practices
  practiceId!: string;

  /**
   * Identificador asociado a product concept.
   */
  @Property({ fieldName: 'product_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  productConceptId?: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Valor de lot number mantenido por la instancia.
   */
  @Property({ fieldName: 'lot_number', columnType: 'varchar', nullable: true })
  lotNumber?: string;

  /**
   * Valor de expiry date mantenido por la instancia.
   */
  @Property({ fieldName: 'expiry_date', columnType: 'date', nullable: true })
  expiryDate?: Date;

  /**
   * Valor de quantity on hand mantenido por la instancia.
   */
  @Property({ fieldName: 'quantity_on_hand', columnType: 'numeric' })
  quantityOnHand!: string;

  /**
   * Identificador asociado a unit concept.
   */
  @Property({ fieldName: 'unit_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  unitConceptId?: string;

  /**
   * Valor de reorder level mantenido por la instancia.
   */
  @Property({
    fieldName: 'reorder_level',
    columnType: 'numeric',
    nullable: true,
  })
  reorderLevel?: string;

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
