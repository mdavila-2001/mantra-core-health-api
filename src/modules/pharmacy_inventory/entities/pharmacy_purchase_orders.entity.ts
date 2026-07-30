import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `pharmacy_purchase_orders`.
 */
@Entity({ schema: 'pharmacy_inventory', tableName: 'pharmacy_purchase_orders' })
export class PharmacyPurchaseOrders {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a pharmacy.
   */
  @Property({ fieldName: 'pharmacy_id', type: 'uuid' }) // FK → pharmacy.pharmacies
  pharmacyId!: string;

  /**
   * Identificador asociado a pharmacy site.
   */
  @Property({ fieldName: 'pharmacy_site_id', type: 'uuid' }) // FK → pharmacy.pharmacy_sites
  pharmacySiteId!: string;

  /**
   * Identificador asociado a pharmacy supplier.
   */
  @Property({ fieldName: 'pharmacy_supplier_id', type: 'uuid' }) // FK → pharmacy_inventory.pharmacy_suppliers
  pharmacySupplierId!: string;

  /**
   * Valor de purchase order number mantenido por la instancia.
   */
  @Property({ fieldName: 'purchase_order_number', columnType: 'varchar' })
  purchaseOrderNumber!: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de ordered at mantenido por la instancia.
   */
  @Property({
    fieldName: 'ordered_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  orderedAt?: Date;

  /**
   * Valor de expected at mantenido por la instancia.
   */
  @Property({
    fieldName: 'expected_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  expectedAt?: Date;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  @Property({
    fieldName: 'idempotency_key',
    columnType: 'varchar',
    nullable: true,
  })
  idempotencyKey?: string;

  /**
   * Identificador asociado a erp purchase order.
   */
  @Property({
    fieldName: 'erp_purchase_order_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.purchase_orders
  erpPurchaseOrderId?: string;

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
