import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'crm', tableName: 'crm_tasks' })
export class CrmTasks {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'crm_activity_id', type: 'uuid' }) // FK → crm.crm_activities
  crmActivityId!: string;

  @Property({ fieldName: 'task_subtype_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  taskSubtypeConceptId!: string;

  @Property({ fieldName: 'priority_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  priorityConceptId?: string;

  @Property({ fieldName: 'due_date', columnType: 'date', nullable: true })
  dueDate?: Date;

  @Property({
    fieldName: 'reminder_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  reminderAt?: Date;

  @Property({ fieldName: 'is_recurring', type: 'boolean', nullable: true })
  isRecurring?: boolean;

  @Property({ fieldName: 'recurrence_rule_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  recurrenceRuleId?: string;

  @Property({
    fieldName: 'completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  completedAt?: Date;

  @Property({
    fieldName: 'completion_note',
    columnType: 'text',
    nullable: true,
  })
  completionNote?: string;

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
