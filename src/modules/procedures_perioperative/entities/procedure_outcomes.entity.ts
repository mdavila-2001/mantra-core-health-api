import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `procedure_outcomes`.
 */
@Entity({ schema: 'procedures_perioperative', tableName: 'procedure_outcomes' })
export class ProcedureOutcomes {
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
   * Identificador asociado a outcome type concept.
   */
  @Property({ fieldName: 'outcome_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  outcomeTypeConceptId!: string;

  /**
   * Valor de measured at mantenido por la instancia.
   */
  @Property({ fieldName: 'measured_at', columnType: 'timestamptz' })
  measuredAt!: Date;

  /**
   * Identificador asociado a observation.
   */
  @Property({ fieldName: 'observation_id', type: 'uuid', nullable: true }) // FK → clinical.observations
  observationId?: string;

  /**
   * Identificador asociado a outcome concept.
   */
  @Property({ fieldName: 'outcome_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  outcomeConceptId?: string;

  /**
   * Valor de numeric value mantenido por la instancia.
   */
  @Property({
    fieldName: 'numeric_value',
    columnType: 'numeric(20,6)',
    nullable: true,
  })
  numericValue?: string;

  /**
   * Identificador asociado a unit concept.
   */
  @Property({ fieldName: 'unit_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  unitConceptId?: string;

  /**
   * Valor de patient reported mantenido por la instancia.
   */
  @Property({ fieldName: 'patient_reported', type: 'boolean', nullable: true })
  patientReported?: boolean;

  /**
   * Valor de instrument code mantenido por la instancia.
   */
  @Property({
    fieldName: 'instrument_code',
    columnType: 'varchar',
    nullable: true,
  })
  instrumentCode?: string;

  /**
   * Valor de interpretation text mantenido por la instancia.
   */
  @Property({
    fieldName: 'interpretation_text',
    columnType: 'text',
    nullable: true,
  })
  interpretationText?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
