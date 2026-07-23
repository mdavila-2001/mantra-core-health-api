import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'erp', tableName: 'employment_records' })
export class EmploymentRecords {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'employee_id', type: 'uuid' }) // FK → erp.employees
  employeeId!: string;

  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  @Property({ fieldName: 'position_id', type: 'uuid', nullable: true }) // FK → erp.positions
  positionId?: string;

  @Property({ fieldName: 'department_id', type: 'uuid', nullable: true }) // FK → erp.departments
  departmentId?: string;

  @Property({ fieldName: 'employment_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  employmentTypeConceptId!: string;

  @Property({ fieldName: 'manager_employee_id', type: 'uuid', nullable: true }) // FK → erp.employees
  managerEmployeeId?: string;

  @Property({ fieldName: 'start_date', columnType: 'date' })
  startDate!: Date;

  @Property({ fieldName: 'end_date', columnType: 'date', nullable: true })
  endDate?: Date;

  @Property({ fieldName: 'fte_ratio', columnType: 'numeric', nullable: true })
  fteRatio?: string;

  @Property({ fieldName: 'base_salary', columnType: 'numeric', nullable: true })
  baseSalary?: string;

  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  @Property({ fieldName: 'contract_id', type: 'uuid', nullable: true }) // FK → erp.contracts
  contractId?: string;

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
