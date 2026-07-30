import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `crm_activity_assignments`.
 */
@Entity({ schema: 'crm', tableName: 'crm_activity_assignments' })
export class CrmActivityAssignments {
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
   * Identificador asociado a assignee user.
   */
  @Property({ fieldName: 'assignee_user_id', type: 'uuid' }) // FK → iam.users
  assigneeUserId!: string;

  /**
   * Identificador asociado a assignment role concept.
   */
  @Property({
    fieldName: 'assignment_role_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  assignmentRoleConceptId?: string;

  /**
   * Valor de assigned at mantenido por la instancia.
   */
  @Property({
    fieldName: 'assigned_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  assignedAt?: Date;

  /**
   * Valor de accepted at mantenido por la instancia.
   */
  @Property({
    fieldName: 'accepted_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  acceptedAt?: Date;

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
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;
}
