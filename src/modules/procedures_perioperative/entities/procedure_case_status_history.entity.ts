import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'procedures_perioperative',
  tableName: 'procedure_case_status_history',
})
export class ProcedureCaseStatusHistory {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'procedure_case_id', type: 'uuid' }) // FK → procedures_perioperative.procedure_cases
  procedureCaseId!: string;

  @Property({ fieldName: 'from_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  fromStatusConceptId!: string;

  @Property({ fieldName: 'to_status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  toStatusConceptId!: string;

  @Property({ fieldName: 'changed_at', columnType: 'timestamptz' })
  changedAt!: Date;

  @Property({ fieldName: 'changed_by_user_id', type: 'uuid' }) // FK → iam.users
  changedByUserId!: string;

  @Property({ fieldName: 'reason_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  reasonConceptId?: string;

  @Property({ fieldName: 'reason_text', columnType: 'text', nullable: true })
  reasonText?: string;

  @Property({
    fieldName: 'workflow_transition_id',
    type: 'uuid',
    nullable: true,
  }) // FK → workflow.state_transition_events
  workflowTransitionId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
