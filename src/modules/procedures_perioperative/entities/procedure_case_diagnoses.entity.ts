import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'procedures_perioperative',
  tableName: 'procedure_case_diagnoses',
})
export class ProcedureCaseDiagnoses {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'procedure_case_id', type: 'uuid' }) // FK → procedures_perioperative.procedure_cases
  procedureCaseId!: string;

  @Property({ fieldName: 'condition_id', type: 'uuid' }) // FK → clinical.conditions
  conditionId!: string;

  @Property({ fieldName: 'diagnosis_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  diagnosisRoleConceptId!: string;

  @Property({ fieldName: 'sequence_number', columnType: 'int' })
  sequenceNumber!: number;

  @Property({ fieldName: 'present_on_admission', type: 'boolean' })
  presentOnAdmission!: boolean;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
