import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'erp', tableName: 'service_entry_items' })
export class ServiceEntryItems {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'service_entry_sheet_id', type: 'uuid' }) // FK → erp.service_entry_sheets
  serviceEntrySheetId!: string;

  @Property({ fieldName: 'purchase_order_item_id', type: 'uuid' }) // FK → erp.purchase_order_items
  purchaseOrderItemId!: string;

  @Property({ fieldName: 'line_number', columnType: 'int' })
  lineNumber!: number;

  @Property({
    fieldName: 'accepted_quantity',
    columnType: 'numeric',
    nullable: true,
  })
  acceptedQuantity?: string;

  @Property({
    fieldName: 'accepted_amount',
    columnType: 'numeric',
    nullable: true,
  })
  acceptedAmount?: string;

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
