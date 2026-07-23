import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'erp', tableName: 'wbs_elements' })
export class WbsElements {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'project_id', type: 'uuid' }) // FK → erp.projects
  projectId!: string;

  @Property({
    fieldName: 'parent_wbs_element_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.wbs_elements
  parentWbsElementId?: string;

  @Property({ fieldName: 'wbs_code', columnType: 'varchar' })
  wbsCode!: string;

  @Property({ columnType: 'varchar' })
  name!: string;

  @Property({ fieldName: 'cost_center_id', type: 'uuid', nullable: true }) // FK → accounting.cost_centers
  costCenterId?: string;

  @Property({ fieldName: 'profit_center_id', type: 'uuid', nullable: true }) // FK → accounting.profit_centers
  profitCenterId?: string;

  @Property({
    fieldName: 'responsible_employee_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.employees
  responsibleEmployeeId?: string;

  @Property({ fieldName: 'start_date', columnType: 'date', nullable: true })
  startDate?: Date;

  @Property({ fieldName: 'end_date', columnType: 'date', nullable: true })
  endDate?: Date;

  @Property({
    fieldName: 'budget_amount',
    columnType: 'numeric',
    nullable: true,
  })
  budgetAmount?: string;

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
