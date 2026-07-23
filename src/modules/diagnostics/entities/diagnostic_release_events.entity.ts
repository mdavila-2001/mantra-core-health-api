import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'diagnostics', tableName: 'diagnostic_release_events' })
export class DiagnosticReleaseEvents {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({
    fieldName: 'diagnostic_report_version_id',
    type: 'uuid',
    nullable: true,
  }) // FK → diagnostics.diagnostic_report_versions
  diagnosticReportVersionId?: string;

  @Property({ fieldName: 'imaging_study_id', type: 'uuid', nullable: true }) // FK → diagnostics.imaging_studies
  imagingStudyId?: string;

  @Property({ fieldName: 'action_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  actionConceptId!: string;

  @Property({ fieldName: 'patient_visibility_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  patientVisibilityConceptId!: string;

  @Property({ fieldName: 'reason_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  reasonConceptId?: string;

  @Property({
    fieldName: 'policy_version',
    columnType: 'varchar',
    nullable: true,
  })
  policyVersion?: string;

  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
