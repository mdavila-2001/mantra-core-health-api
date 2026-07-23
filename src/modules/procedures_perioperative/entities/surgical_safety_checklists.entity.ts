import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'procedures_perioperative',
  tableName: 'surgical_safety_checklists',
})
export class SurgicalSafetyChecklists {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'procedure_case_id', type: 'uuid' }) // FK → procedures_perioperative.procedure_cases
  procedureCaseId!: string;

  @Property({ fieldName: 'checklist_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  checklistTypeConceptId!: string;

  @Property({ fieldName: 'checklist_version', columnType: 'varchar' })
  checklistVersion!: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'sign_in_completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  signInCompletedAt?: Date;

  @Property({
    fieldName: 'time_out_completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  timeOutCompletedAt?: Date;

  @Property({
    fieldName: 'sign_out_completed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  signOutCompletedAt?: Date;

  @Property({
    fieldName: 'coordinator_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK (destino no resuelto)
  coordinatorProfileId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
