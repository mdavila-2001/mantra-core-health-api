import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `purchase_quotations`.
 */
@Entity({ schema: 'pharmacy_inventory', tableName: 'purchase_quotations' })
export class PurchaseQuotations {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  /**
   * Identificador asociado a pharmacy site.
   */
  @Property({ fieldName: 'pharmacy_site_id', type: 'uuid', nullable: true })
  pharmacySiteId?: string;

  /**
   * Identificador asociado a supplier partner.
   */
  @Property({ fieldName: 'supplier_partner_id', type: 'uuid', nullable: true })
  supplierPartnerId?: string;

  /**
   * Valor de quotation number mantenido por la instancia.
   */
  @Property({
    fieldName: 'quotation_number',
    columnType: 'varchar',
    nullable: true,
  })
  quotationNumber?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid', nullable: true })
  statusConceptId?: string;

  /**
   * Valor de currency code mantenido por la instancia.
   */
  @Property({
    fieldName: 'currency_code',
    columnType: 'char(3)',
    nullable: true,
  })
  currencyCode?: string;

  /**
   * Valor de valid until mantenido por la instancia.
   */
  @Property({ fieldName: 'valid_until', columnType: 'date', nullable: true })
  validUntil?: string;

  /**
   * Valor de total amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'total_amount',
    columnType: 'numeric',
    nullable: true,
  })
  totalAmount?: string;

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
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true })
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true })
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
