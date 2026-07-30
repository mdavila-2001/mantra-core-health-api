import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `pharmacy_purchase_order_lines`.
 */
@Entity({
  schema: 'pharmacy_inventory',
  tableName: 'pharmacy_purchase_order_lines',
})
export class PharmacyPurchaseOrderLines {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a pharmacy purchase order.
   */
  @Property({ fieldName: 'pharmacy_purchase_order_id', type: 'uuid' }) // FK → pharmacy_inventory.pharmacy_purchase_orders
  pharmacyPurchaseOrderId!: string;

  /**
   * Identificador asociado a pharmacy product.
   */
  @Property({ fieldName: 'pharmacy_product_id', type: 'uuid' }) // FK → pharmacy.pharmacy_products
  pharmacyProductId!: string;

  /**
   * Identificador asociado a erp purchase order item.
   */
  @Property({
    fieldName: 'erp_purchase_order_item_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.purchase_order_items
  erpPurchaseOrderItemId?: string;

  /**
   * Valor de ordered quantity mantenido por la instancia.
   */
  @Property({ fieldName: 'ordered_quantity', columnType: 'numeric' })
  orderedQuantity!: string;

  /**
   * Valor de received quantity mantenido por la instancia.
   */
  @Property({
    fieldName: 'received_quantity',
    columnType: 'numeric',
    nullable: true,
  })
  receivedQuantity?: string;

  /**
   * Valor de unit cost amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'unit_cost_amount',
    columnType: 'numeric',
    nullable: true,
  })
  unitCostAmount?: string;

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
