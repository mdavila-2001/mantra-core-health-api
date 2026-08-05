import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `procedure_case_diagnoses`.
 */
@Entity({
  schema: 'procedures_perioperative',
  tableName: 'procedure_case_diagnoses',
})
export class ProcedureCaseDiagnoses {
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
   * Identificador asociado a condition.
   */
  @Property({ fieldName: 'condition_id', type: 'uuid' }) // FK → clinical.conditions
  conditionId!: string;

  /**
   * Identificador asociado a diagnosis role concept.
   */
  @Property({ fieldName: 'diagnosis_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  diagnosisRoleConceptId!: string;

  /**
   * Valor de sequence number mantenido por la instancia.
   */
  @Property({ fieldName: 'sequence_number', columnType: 'int' })
  sequenceNumber!: number;

  /**
   * Valor de present on admission mantenido por la instancia.
   */
  @Property({ fieldName: 'present_on_admission', type: 'boolean' })
  presentOnAdmission!: boolean;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
