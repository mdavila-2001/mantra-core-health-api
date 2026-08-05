import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `employment_records`.
 */
@Entity({ schema: 'erp', tableName: 'employment_records' })
export class EmploymentRecords {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a employee.
   */
  @Property({ fieldName: 'employee_id', type: 'uuid' }) // FK → erp.employees
  employeeId!: string;

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /**
   * Identificador asociado a position.
   */
  @Property({ fieldName: 'position_id', type: 'uuid', nullable: true }) // FK → erp.positions
  positionId?: string;

  /**
   * Identificador asociado a department.
   */
  @Property({ fieldName: 'department_id', type: 'uuid', nullable: true }) // FK → erp.departments
  departmentId?: string;

  /**
   * Identificador asociado a employment type concept.
   */
  @Property({ fieldName: 'employment_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  employmentTypeConceptId!: string;

  /**
   * Identificador asociado a manager employee.
   */
  @Property({ fieldName: 'manager_employee_id', type: 'uuid', nullable: true }) // FK → erp.employees
  managerEmployeeId?: string;

  /**
   * Valor de start date mantenido por la instancia.
   */
  @Property({ fieldName: 'start_date', columnType: 'date' })
  startDate!: Date;

  /**
   * Valor de end date mantenido por la instancia.
   */
  @Property({ fieldName: 'end_date', columnType: 'date', nullable: true })
  endDate?: Date;

  /**
   * Valor de fte ratio mantenido por la instancia.
   */
  @Property({ fieldName: 'fte_ratio', columnType: 'numeric', nullable: true })
  fteRatio?: string;

  /**
   * Valor de base salary mantenido por la instancia.
   */
  @Property({ fieldName: 'base_salary', columnType: 'numeric', nullable: true })
  baseSalary?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

  /**
   * Identificador asociado a contract.
   */
  @Property({ fieldName: 'contract_id', type: 'uuid', nullable: true }) // FK → erp.contracts
  contractId?: string;

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
