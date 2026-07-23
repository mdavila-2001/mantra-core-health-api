import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'procedures_perioperative', tableName: 'procedure_outcomes' })
export class ProcedureOutcomes {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'procedure_case_id', type: 'uuid' }) // FK → procedures_perioperative.procedure_cases
  procedureCaseId!: string;

  @Property({ fieldName: 'outcome_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  outcomeTypeConceptId!: string;

  @Property({ fieldName: 'measured_at', columnType: 'timestamptz' })
  measuredAt!: Date;

  @Property({ fieldName: 'observation_id', type: 'uuid', nullable: true }) // FK → clinical.observations
  observationId?: string;

  @Property({ fieldName: 'outcome_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  outcomeConceptId?: string;

  @Property({
    fieldName: 'numeric_value',
    columnType: 'numeric(20,6)',
    nullable: true,
  })
  numericValue?: string;

  @Property({ fieldName: 'unit_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  unitConceptId?: string;

  @Property({ fieldName: 'patient_reported', type: 'boolean', nullable: true })
  patientReported?: boolean;

  @Property({
    fieldName: 'instrument_code',
    columnType: 'varchar',
    nullable: true,
  })
  instrumentCode?: string;

  @Property({
    fieldName: 'interpretation_text',
    columnType: 'text',
    nullable: true,
  })
  interpretationText?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
