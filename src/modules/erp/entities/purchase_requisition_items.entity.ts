import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'erp', tableName: 'purchase_requisition_items' })
export class PurchaseRequisitionItems {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'purchase_requisition_id', type: 'uuid' }) // FK → erp.purchase_requisitions
  purchaseRequisitionId!: string;

  @Property({ fieldName: 'line_number', columnType: 'int' })
  lineNumber!: number;

  @Property({ fieldName: 'item_type_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  itemTypeConceptId?: string;

  @Property({ columnType: 'varchar', nullable: true })
  description?: string;

  @Property({
    fieldName: 'product_ref_type',
    columnType: 'varchar',
    nullable: true,
  })
  productRefType?: string;

  @Property({ fieldName: 'product_ref_id', type: 'uuid', nullable: true })
  productRefId?: string;

  @Property({ columnType: 'numeric', nullable: true })
  quantity?: string;

  @Property({ fieldName: 'unit_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  unitConceptId?: string;

  @Property({
    fieldName: 'estimated_unit_price',
    columnType: 'numeric',
    nullable: true,
  })
  estimatedUnitPrice?: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  @Property({ fieldName: 'cost_center_id', type: 'uuid', nullable: true }) // FK → accounting.cost_centers
  costCenterId?: string;

  @Property({ fieldName: 'profit_center_id', type: 'uuid', nullable: true }) // FK → accounting.profit_centers
  profitCenterId?: string;

  @Property({ fieldName: 'project_id', type: 'uuid', nullable: true }) // FK → erp.projects
  projectId?: string;

  @Property({ fieldName: 'wbs_element_id', type: 'uuid', nullable: true }) // FK → erp.wbs_elements
  wbsElementId?: string;

  @Property({ fieldName: 'asset_id', type: 'uuid', nullable: true }) // FK → accounting.assets
  assetId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
