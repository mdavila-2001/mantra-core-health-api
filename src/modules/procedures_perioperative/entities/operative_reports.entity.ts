import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'procedures_perioperative', tableName: 'operative_reports' })
export class OperativeReports {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'procedure_case_id', type: 'uuid' }) // FK → procedures_perioperative.procedure_cases
  procedureCaseId!: string;

  @Property({ fieldName: 'procedure_id', type: 'uuid' }) // FK → clinical.procedures
  procedureId!: string;

  @Property({ fieldName: 'report_version', columnType: 'int' })
  reportVersion!: number;

  @Property({ fieldName: 'author_profile_id', type: 'uuid' }) // FK → profiles.health_practitioner_profiles
  authorProfileId!: string;

  @Property({ fieldName: 'authored_at', columnType: 'timestamptz' })
  authoredAt!: Date;

  @Property({
    fieldName: 'preoperative_diagnosis_text',
    columnType: 'text',
    nullable: true,
  })
  preoperativeDiagnosisText?: string;

  @Property({
    fieldName: 'postoperative_diagnosis_text',
    columnType: 'text',
    nullable: true,
  })
  postoperativeDiagnosisText?: string;

  @Property({
    fieldName: 'procedure_description',
    columnType: 'text',
    nullable: true,
  })
  procedureDescription?: string;

  @Property({ fieldName: 'findings_text', columnType: 'text', nullable: true })
  findingsText?: string;

  @Property({
    fieldName: 'estimated_blood_loss_ml',
    columnType: 'numeric(12,3)',
    nullable: true,
  })
  estimatedBloodLossMl?: string;

  @Property({ fieldName: 'drains_text', columnType: 'text', nullable: true })
  drainsText?: string;

  @Property({
    fieldName: 'complications_text',
    columnType: 'text',
    nullable: true,
  })
  complicationsText?: string;

  @Property({
    fieldName: 'disposition_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  dispositionConceptId?: string;

  @Property({ fieldName: 'file_id', type: 'uuid', nullable: true }) // FK → common.files
  fileId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'signed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  signedAt?: Date;

  @Property({ fieldName: 'signature_id', type: 'uuid', nullable: true }) // FK → chart.clinical_note_signatures
  signatureId?: string;

  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;
}
