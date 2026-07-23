import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({
  schema: 'procedures_perioperative',
  tableName: 'procedure_specimens',
})
export class ProcedureSpecimens {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'procedure_case_id', type: 'uuid' }) // FK → procedures_perioperative.procedure_cases
  procedureCaseId!: string;

  @Property({ fieldName: 'procedure_id', type: 'uuid' }) // FK → clinical.procedures
  procedureId!: string;

  @Property({ fieldName: 'specimen_id', type: 'uuid' }) // FK → diagnostics.specimens
  specimenId!: string;

  @Property({ fieldName: 'specimen_role_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  specimenRoleConceptId!: string;

  @Property({ fieldName: 'operative_step_id', type: 'uuid', nullable: true }) // FK → procedures_perioperative.operative_steps
  operativeStepId?: string;

  @Property({ fieldName: 'body_site_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  bodySiteConceptId?: string;

  @Property({
    fieldName: 'orientation_text',
    columnType: 'text',
    nullable: true,
  })
  orientationText?: string;

  @Property({
    fieldName: 'surgeon_comment',
    columnType: 'text',
    nullable: true,
  })
  surgeonComment?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
