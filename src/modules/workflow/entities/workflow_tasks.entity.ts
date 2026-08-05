import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `workflow_tasks`.
 */
@Entity({ schema: 'workflow', tableName: 'workflow_tasks' })
export class WorkflowTasks {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a workflow instance.
   */
  @Property({ fieldName: 'workflow_instance_id', type: 'uuid' }) // FK → workflow.workflow_instances
  workflowInstanceId!: string;

  /**
   * Valor de task code mantenido por la instancia.
   */
  @Property({ fieldName: 'task_code', columnType: 'varchar' })
  taskCode!: string;

  /**
   * Identificador asociado a task type concept.
   */
  @Property({ fieldName: 'task_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  taskTypeConceptId!: string;

  /**
   * Identificador asociado a assigned user.
   */
  @Property({ fieldName: 'assigned_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  assignedUserId?: string;

  /**
   * Identificador asociado a assigned role concept.
   */
  @Property({
    fieldName: 'assigned_role_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  assignedRoleConceptId?: string;

  /**
   * Identificador asociado a required permission.
   */
  @Property({
    fieldName: 'required_permission_id',
    type: 'uuid',
    nullable: true,
  }) // FK → authz.permissions
  requiredPermissionId?: string;

  /**
   * Valor de due at mantenido por la instancia.
   */
  @Property({ fieldName: 'due_at', columnType: 'timestamptz', nullable: true })
  dueAt?: Date;

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
