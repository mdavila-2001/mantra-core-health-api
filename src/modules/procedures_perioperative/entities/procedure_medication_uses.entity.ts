import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'procedures_perioperative',
  tableName: 'procedure_medication_uses',
})
export class ProcedureMedicationUses {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'procedure_case_id', type: 'uuid' }) // FK → procedures_perioperative.procedure_cases
  procedureCaseId!: string;

  @Property({ fieldName: 'procedure_id', type: 'uuid', nullable: true }) // FK → clinical.procedures
  procedureId?: string;

  @Property({ fieldName: 'medication_administration_id', type: 'uuid' }) // FK (destino no resuelto)
  medicationAdministrationId!: string;

  @Property({ fieldName: 'use_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  useRoleConceptId!: string;

  @Property({ fieldName: 'operative_step_id', type: 'uuid', nullable: true }) // FK → procedures_perioperative.operative_steps
  operativeStepId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
