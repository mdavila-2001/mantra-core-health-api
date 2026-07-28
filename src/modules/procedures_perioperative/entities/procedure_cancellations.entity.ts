import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `procedure_cancellations`.
 */
@Entity({
  schema: 'procedures_perioperative',
  tableName: 'procedure_cancellations',
})
export class ProcedureCancellations {
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
   * Valor de cancelled at mantenido por la instancia.
   */
  @Property({ fieldName: 'cancelled_at', columnType: 'timestamptz' })
  cancelledAt!: Date;

  /**
   * Identificador asociado a cancellation reason concept.
   */
  @Property({ fieldName: 'cancellation_reason_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  cancellationReasonConceptId!: string;

  /**
   * Identificador asociado a cancellation category concept.
   */
  @Property({
    fieldName: 'cancellation_category_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  cancellationCategoryConceptId?: string;

  /**
   * Identificador asociado a cancelled by user.
   */
  @Property({ fieldName: 'cancelled_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  cancelledByUserId?: string;

  /**
   * Identificador asociado a preventable concept.
   */
  @Property({
    fieldName: 'preventable_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  preventableConceptId?: string;

  /**
   * Valor de explanation text mantenido por la instancia.
   */
  @Property({
    fieldName: 'explanation_text',
    columnType: 'text',
    nullable: true,
  })
  explanationText?: string;

  /**
   * Valor de reschedule required mantenido por la instancia.
   */
  @Property({
    fieldName: 'reschedule_required',
    type: 'boolean',
    nullable: true,
  })
  rescheduleRequired?: boolean;

  /**
   * Identificador asociado a replacement case.
   */
  @Property({ fieldName: 'replacement_case_id', type: 'uuid', nullable: true }) // FK → procedures_perioperative.procedure_cases
  replacementCaseId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
