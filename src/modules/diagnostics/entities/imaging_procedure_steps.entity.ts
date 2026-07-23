import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'diagnostics', tableName: 'imaging_procedure_steps' })
export class ImagingProcedureSteps {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'imaging_study_id', type: 'uuid' }) // FK → diagnostics.imaging_studies
  imagingStudyId!: string;

  @Property({ fieldName: 'procedure_id', type: 'uuid', nullable: true }) // FK → clinical.procedures
  procedureId?: string;

  @Property({ fieldName: 'step_number', columnType: 'int' })
  stepNumber!: number;

  @Property({ fieldName: 'code_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  codeConceptId!: string;

  @Property({ fieldName: 'modality_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  modalityConceptId?: string;

  @Property({ fieldName: 'body_site_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  bodySiteConceptId?: string;

  @Property({
    fieldName: 'performed_by_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK (destino no resuelto)
  performedByProfileId?: string;

  @Property({
    fieldName: 'started_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startedAt?: Date;

  @Property({
    fieldName: 'ended_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  endedAt?: Date;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'protocol_reference',
    columnType: 'varchar',
    nullable: true,
  })
  protocolReference?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
