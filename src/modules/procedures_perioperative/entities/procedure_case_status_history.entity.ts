import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `procedure_case_status_history`.
 */
@Entity({
  schema: 'procedures_perioperative',
  tableName: 'procedure_case_status_history',
})
export class ProcedureCaseStatusHistory {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a procedure case.
   */
  @Property({ fieldName: 'procedure_case_id', type: 'uuid' }) // FK → procedures_perioperative.procedure_cases
  procedureCaseId!: string;

  /**
   * Identificador asociado a from status concept.
   */
  @Property({ fieldName: 'from_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  fromStatusConceptId!: string;

  /**
   * Identificador asociado a to status concept.
   */
  @Property({ fieldName: 'to_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  toStatusConceptId!: string;

  /**
   * Valor de changed at mantenido por la instancia.
   */
  @Property({ fieldName: 'changed_at', columnType: 'timestamptz' })
  changedAt!: Date;

  /**
   * Identificador asociado a changed by user.
   */
  @Property({ fieldName: 'changed_by_user_id', type: 'uuid' }) // FK → iam.users
  changedByUserId!: string;

  /**
   * Identificador asociado a reason concept.
   */
  @Property({ fieldName: 'reason_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  reasonConceptId?: string;

  /**
   * Valor de reason text mantenido por la instancia.
   */
  @Property({ fieldName: 'reason_text', columnType: 'text', nullable: true })
  reasonText?: string;

  /**
   * Identificador asociado a workflow transition.
   */
  @Property({
    fieldName: 'workflow_transition_id',
    type: 'uuid',
    nullable: true,
  }) // FK → workflow.state_transition_events
  workflowTransitionId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
