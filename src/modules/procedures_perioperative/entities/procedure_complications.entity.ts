import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `procedure_complications`.
 */
@Entity({
  schema: 'procedures_perioperative',
  tableName: 'procedure_complications',
})
export class ProcedureComplications {
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
   * Identificador asociado a procedure.
   */
  @Property({ fieldName: 'procedure_id', type: 'uuid', nullable: true }) // FK → clinical.procedures
  procedureId?: string;

  /**
   * Identificador asociado a complication code concept.
   */
  @Property({ fieldName: 'complication_code_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  complicationCodeConceptId!: string;

  /**
   * Valor de onset at mantenido por la instancia.
   */
  @Property({ fieldName: 'onset_at', columnType: 'timestamptz' })
  onsetAt!: Date;

  /**
   * Valor de resolved at mantenido por la instancia.
   */
  @Property({
    fieldName: 'resolved_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  resolvedAt?: Date;

  /**
   * Identificador asociado a severity concept.
   */
  @Property({ fieldName: 'severity_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  severityConceptId!: string;

  /**
   * Identificador asociado a relatedness concept.
   */
  @Property({ fieldName: 'relatedness_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  relatednessConceptId!: string;

  /**
   * Identificador asociado a condition.
   */
  @Property({ fieldName: 'condition_id', type: 'uuid', nullable: true }) // FK → clinical.conditions
  conditionId?: string;

  /**
   * Valor de management text mantenido por la instancia.
   */
  @Property({
    fieldName: 'management_text',
    columnType: 'text',
    nullable: true,
  })
  managementText?: string;

  /**
   * Identificador asociado a outcome concept.
   */
  @Property({ fieldName: 'outcome_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  outcomeConceptId?: string;

  /**
   * Identificador asociado a reported by profile.
   */
  @Property({
    fieldName: 'reported_by_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK → profiles.health_practitioner_profiles
  reportedByProfileId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
