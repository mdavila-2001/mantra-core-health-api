import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `procedure_case_milestones`.
 */
@Entity({
  schema: 'procedures_perioperative',
  tableName: 'procedure_case_milestones',
})
export class ProcedureCaseMilestones {
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
   * Identificador asociado a milestone type concept.
   */
  @Property({ fieldName: 'milestone_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  milestoneTypeConceptId!: string;

  /**
   * Valor de planned at mantenido por la instancia.
   */
  @Property({
    fieldName: 'planned_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  plannedAt?: Date;

  /**
   * Valor de occurred at mantenido por la instancia.
   */
  @Property({
    fieldName: 'occurred_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  occurredAt?: Date;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Identificador asociado a recorded by profile.
   */
  @Property({
    fieldName: 'recorded_by_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK → profiles.health_practitioner_profiles
  recordedByProfileId?: string;

  /**
   * Valor de notes mantenido por la instancia.
   */
  @Property({ columnType: 'text', nullable: true })
  notes?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
