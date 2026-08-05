import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `purchase_order_items`.
 */
@Entity({ schema: 'erp', tableName: 'purchase_order_items' })
export class PurchaseOrderItems {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a purchase order.
   */
  @Property({ fieldName: 'purchase_order_id', type: 'uuid' }) // FK → erp.purchase_orders
  purchaseOrderId!: string;

  /**
   * Valor de line number mantenido por la instancia.
   */
  @Property({ fieldName: 'line_number', columnType: 'int' })
  lineNumber!: number;

  /**
   * Identificador asociado a purchase requisition item.
   */
  @Property({
    fieldName: 'purchase_requisition_item_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.purchase_requisition_items
  purchaseRequisitionItemId?: string;

  /**
   * Identificador asociado a contract line item.
   */
  @Property({
    fieldName: 'contract_line_item_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.contract_line_items
  contractLineItemId?: string;

  /**
   * Identificador asociado a item type concept.
   */
  @Property({ fieldName: 'item_type_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  itemTypeConceptId?: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @Property({ columnType: 'varchar', nullable: true })
  description?: string;

  /**
   * Valor de product ref type mantenido por la instancia.
   */
  @Property({
    fieldName: 'product_ref_type',
    columnType: 'varchar',
    nullable: true,
  })
  productRefType?: string;

  /**
   * Identificador asociado a product ref.
   */
  @Property({ fieldName: 'product_ref_id', type: 'uuid', nullable: true })
  productRefId?: string;

  /**
   * Valor de quantity mantenido por la instancia.
   */
  @Property({ columnType: 'numeric', nullable: true })
  quantity?: string;

  /**
   * Identificador asociado a unit concept.
   */
  @Property({ fieldName: 'unit_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  unitConceptId?: string;

  /**
   * Valor de unit price mantenido por la instancia.
   */
  @Property({ fieldName: 'unit_price', columnType: 'numeric', nullable: true })
  unitPrice?: string;

  /**
   * Identificador asociado a tax code.
   */
  @Property({ fieldName: 'tax_code_id', type: 'uuid', nullable: true }) // FK → billing.tax_codes
  taxCodeId?: string;

  /**
   * Identificador asociado a expense account.
   */
  @Property({ fieldName: 'expense_account_id', type: 'uuid', nullable: true }) // FK → accounting.accounts
  expenseAccountId?: string;

  /**
   * Identificador asociado a inventory account.
   */
  @Property({ fieldName: 'inventory_account_id', type: 'uuid', nullable: true }) // FK → accounting.accounts
  inventoryAccountId?: string;

  /**
   * Identificador asociado a asset.
   */
  @Property({ fieldName: 'asset_id', type: 'uuid', nullable: true }) // FK → accounting.assets
  assetId?: string;

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
   * Identificador asociado a branch.
   */
  @Property({ fieldName: 'branch_id', type: 'uuid', nullable: true }) // FK → directory.branches
  branchId?: string;

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
