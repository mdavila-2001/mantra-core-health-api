import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `purchase_requisitions`.
 */
@Entity({ schema: 'erp', tableName: 'purchase_requisitions' })
export class PurchaseRequisitions {
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
   * Valor de requisition number mantenido por la instancia.
   */
  @Property({ fieldName: 'requisition_number', columnType: 'varchar' })
  requisitionNumber!: string;

  /**
   * Identificador asociado a requester employee.
   */
  @Property({
    fieldName: 'requester_employee_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.employees
  requesterEmployeeId?: string;

  /**
   * Identificador asociado a requesting department.
   */
  @Property({
    fieldName: 'requesting_department_id',
    type: 'uuid',
    nullable: true,
  }) // FK → erp.departments
  requestingDepartmentId?: string;

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
   * Valor de required by date mantenido por la instancia.
   */
  @Property({
    fieldName: 'required_by_date',
    columnType: 'date',
    nullable: true,
  })
  requiredByDate?: Date;

  /**
   * Identificador asociado a approval status concept.
   */
  @Property({
    fieldName: 'approval_status_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  approvalStatusConceptId?: string;

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
