import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'procedures_perioperative',
  tableName: 'procedure_cancellations',
})
export class ProcedureCancellations {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'procedure_case_id', type: 'uuid' }) // FK → procedures_perioperative.procedure_cases
  procedureCaseId!: string;

  @Property({ fieldName: 'cancelled_at', columnType: 'timestamptz' })
  cancelledAt!: Date;

  @Property({ fieldName: 'cancellation_reason_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  cancellationReasonConceptId!: string;

  @Property({
    fieldName: 'cancellation_category_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  cancellationCategoryConceptId?: string;

  @Property({ fieldName: 'cancelled_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  cancelledByUserId?: string;

  @Property({
    fieldName: 'preventable_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  preventableConceptId?: string;

  @Property({
    fieldName: 'explanation_text',
    columnType: 'text',
    nullable: true,
  })
  explanationText?: string;

  @Property({
    fieldName: 'reschedule_required',
    type: 'boolean',
    nullable: true,
  })
  rescheduleRequired?: boolean;

  @Property({ fieldName: 'replacement_case_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  replacementCaseId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
