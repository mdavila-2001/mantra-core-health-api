import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `procedure_medication_uses`.
 */
@Entity({
  schema: 'procedures_perioperative',
  tableName: 'procedure_medication_uses',
})
export class ProcedureMedicationUses {
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
   * Identificador asociado a medication administration.
   */
  @Property({ fieldName: 'medication_administration_id', type: 'uuid' }) // FK → clinical.medication_records
  medicationAdministrationId!: string;

  /**
   * Identificador asociado a use role concept.
   */
  @Property({ fieldName: 'use_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  useRoleConceptId!: string;

  /**
   * Identificador asociado a operative step.
   */
  @Property({ fieldName: 'operative_step_id', type: 'uuid', nullable: true }) // FK → procedures_perioperative.operative_steps
  operativeStepId?: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
