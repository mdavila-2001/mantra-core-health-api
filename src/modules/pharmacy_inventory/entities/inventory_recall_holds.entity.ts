import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `inventory_recall_holds`.
 */
@Entity({ schema: 'pharmacy_inventory', tableName: 'inventory_recall_holds' })
export class InventoryRecallHolds {
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
   * Identificador asociado a inventory lot.
   */
  @Property({ fieldName: 'inventory_lot_id', type: 'uuid', nullable: true }) // FK → pharmacy_inventory.inventory_lots
  inventoryLotId?: string;

  /**
   * Valor de recall reference mantenido por la instancia.
   */
  @Property({ fieldName: 'recall_reference', columnType: 'varchar' })
  recallReference!: string;

  /**
   * Identificador asociado a recall class concept.
   */
  @Property({ fieldName: 'recall_class_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  recallClassConceptId!: string;

  /**
   * Identificador asociado a hold status concept.
   */
  @Property({ fieldName: 'hold_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  holdStatusConceptId!: string;

  /**
   * Valor de initiated at mantenido por la instancia.
   */
  @Property({
    fieldName: 'initiated_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  initiatedAt?: Date;

  /**
   * Valor de released at mantenido por la instancia.
   */
  @Property({
    fieldName: 'released_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  releasedAt?: Date;

  /**
   * Identificador asociado a source authority tenant.
   */
  @Property({
    fieldName: 'source_authority_tenant_id',
    type: 'uuid',
    nullable: true,
  }) // FK → directory.tenants
  sourceAuthorityTenantId?: string;

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
