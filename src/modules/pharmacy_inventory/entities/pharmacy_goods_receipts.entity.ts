import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `pharmacy_goods_receipts`.
 */
@Entity({ schema: 'pharmacy_inventory', tableName: 'pharmacy_goods_receipts' })
export class PharmacyGoodsReceipts {
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
   * Identificador asociado a pharmacy site.
   */
  @Property({ fieldName: 'pharmacy_site_id', type: 'uuid' }) // FK → pharmacy.pharmacy_sites
  pharmacySiteId!: string;

  /**
   * Identificador asociado a erp goods receipt.
   */
  @Property({ fieldName: 'erp_goods_receipt_id', type: 'uuid', nullable: true }) // FK → erp.goods_receipts
  erpGoodsReceiptId?: string;

  /**
   * Valor de receipt number mantenido por la instancia.
   */
  @Property({ fieldName: 'receipt_number', columnType: 'varchar' })
  receiptNumber!: string;

  /**
   * Valor de received at mantenido por la instancia.
   */
  @Property({ fieldName: 'received_at', columnType: 'timestamptz' })
  receivedAt!: Date;

  /**
   * Valor de supplier delivery reference mantenido por la instancia.
   */
  @Property({
    fieldName: 'supplier_delivery_reference',
    columnType: 'varchar',
    nullable: true,
  })
  supplierDeliveryReference?: string;

  /**
   * Identificador asociado a source document file.
   */
  @Property({
    fieldName: 'source_document_file_id',
    type: 'uuid',
    nullable: true,
  }) // FK → common.files
  sourceDocumentFileId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

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
