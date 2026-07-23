import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'workflow', tableName: 'workflow_tasks' })
export class WorkflowTasks {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'workflow_instance_id', type: 'uuid' }) // FK → workflow.workflow_instances
  workflowInstanceId!: string;

  @Property({ fieldName: 'task_code', columnType: 'varchar' })
  taskCode!: string;

  @Property({ fieldName: 'task_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  taskTypeConceptId!: string;

  @Property({ fieldName: 'assigned_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  assignedUserId?: string;

  @Property({
    fieldName: 'assigned_role_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  assignedRoleConceptId?: string;

  @Property({
    fieldName: 'required_permission_id',
    type: 'uuid',
    nullable: true,
  }) // FK → authz.permissions
  requiredPermissionId?: string;

  @Property({ fieldName: 'due_at', columnType: 'timestamptz', nullable: true })
  dueAt?: Date;

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
