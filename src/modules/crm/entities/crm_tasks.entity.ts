import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `crm_tasks`.
 */
@Entity({ schema: 'crm', tableName: 'crm_tasks' })
export class CrmTasks {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a crm activity.
   */
  @Property({ fieldName: 'crm_activity_id', type: 'uuid' }) // FK → crm.crm_activities
  crmActivityId!: string;

  /**
   * Identificador asociado a task subtype concept.
   */
  @Property({ fieldName: 'task_subtype_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  taskSubtypeConceptId!: string;

  /**
   * Identificador asociado a priority concept.
   */
  @Property({ fieldName: 'priority_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  priorityConceptId?: string;

  /**
   * Valor de due date mantenido por la instancia.
   */
  @Property({ fieldName: 'due_date', columnType: 'date', nullable: true })
  dueDate?: Date;

  /**
   * Valor de reminder at mantenido por la instancia.
   */
  @Property({
    fieldName: 'reminder_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  reminderAt?: Date;

  /**
   * Valor de is recurring mantenido por la instancia.
   */
  @Property({ fieldName: 'is_recurring', type: 'boolean', nullable: true })
  isRecurring?: boolean;

  /**
   * Identificador asociado a recurrence rule.
   */
  @Property({ fieldName: 'recurrence_rule_id', type: 'uuid', nullable: true }) // FK → crm.crm_recurrence_rules
  recurrenceRuleId?: string;

  /**
   * Valor de completed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  completedAt?: Date;

  /**
   * Valor de completion note mantenido por la instancia.
   */
  @Property({
    fieldName: 'completion_note',
    columnType: 'text',
    nullable: true,
  })
  completionNote?: string;

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
