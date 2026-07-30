import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `service_entry_items`.
 */
@Entity({ schema: 'erp', tableName: 'service_entry_items' })
export class ServiceEntryItems {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a service entry sheet.
   */
  @Property({ fieldName: 'service_entry_sheet_id', type: 'uuid' }) // FK → erp.service_entry_sheets
  serviceEntrySheetId!: string;

  /**
   * Identificador asociado a purchase order item.
   */
  @Property({ fieldName: 'purchase_order_item_id', type: 'uuid' }) // FK → erp.purchase_order_items
  purchaseOrderItemId!: string;

  /**
   * Valor de line number mantenido por la instancia.
   */
  @Property({ fieldName: 'line_number', columnType: 'int' })
  lineNumber!: number;

  /**
   * Valor de accepted quantity mantenido por la instancia.
   */
  @Property({
    fieldName: 'accepted_quantity',
    columnType: 'numeric',
    nullable: true,
  })
  acceptedQuantity?: string;

  /**
   * Valor de accepted amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'accepted_amount',
    columnType: 'numeric',
    nullable: true,
  })
  acceptedAmount?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  /**
   * Identificador asociado a cost center.
   */
  @Property({ fieldName: 'cost_center_id', type: 'uuid', nullable: true }) // FK → accounting.cost_centers
  costCenterId?: string;

  /**
   * Identificador asociado a profit center.
   */
  @Property({ fieldName: 'profit_center_id', type: 'uuid', nullable: true }) // FK → accounting.profit_centers
  profitCenterId?: string;

  /**
   * Identificador asociado a project.
   */
  @Property({ fieldName: 'project_id', type: 'uuid', nullable: true }) // FK → erp.projects
  projectId?: string;

  /**
   * Identificador asociado a wbs element.
   */
  @Property({ fieldName: 'wbs_element_id', type: 'uuid', nullable: true }) // FK → erp.wbs_elements
  wbsElementId?: string;

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
