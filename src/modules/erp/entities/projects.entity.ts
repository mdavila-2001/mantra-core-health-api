import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `projects`.
 */
@Entity({ schema: 'erp', tableName: 'projects' })
export class Projects {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a tenant.
   */
  @Property({ fieldName: 'tenant_id', type: 'uuid' }) // FK → directory.tenants
  tenantId!: string;

  /**
   * Valor de project number mantenido por la instancia.
   */
  @Property({ fieldName: 'project_number', columnType: 'varchar' })
  projectNumber!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @Property({ columnType: 'varchar' })
  name!: string;

  /**
   * Identificador asociado a project type concept.
   */
  @Property({
    fieldName: 'project_type_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  projectTypeConceptId?: string;

  /**
   * Identificador asociado a responsible employee.
   */
  @Property({
    fieldName: 'responsible_employee_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.employees
  responsibleEmployeeId?: string;

  /**
   * Identificador asociado a department.
   */
  @Property({ fieldName: 'department_id', type: 'uuid', nullable: true }) // FK → erp.departments
  departmentId?: string;

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
   * Valor de start date mantenido por la instancia.
   */
  @Property({ fieldName: 'start_date', columnType: 'date', nullable: true })
  startDate?: Date;

  /**
   * Valor de end date mantenido por la instancia.
   */
  @Property({ fieldName: 'end_date', columnType: 'date', nullable: true })
  endDate?: Date;

  /**
   * Valor de budget amount mantenido por la instancia.
   */
  @Property({
    fieldName: 'budget_amount',
    columnType: 'numeric',
    nullable: true,
  })
  budgetAmount?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @Property({ fieldName: 'currency_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  currencyConceptId?: string;

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
