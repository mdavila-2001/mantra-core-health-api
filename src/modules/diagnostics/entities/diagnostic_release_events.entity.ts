import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `diagnostic_release_events`.
 */
@Entity({ schema: 'diagnostics', tableName: 'diagnostic_release_events' })
export class DiagnosticReleaseEvents {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a diagnostic report version.
   */
  @Property({
    fieldName: 'diagnostic_report_version_id',
    type: 'uuid',
    nullable: true,
  }) // FK → diagnostics.diagnostic_report_versions
  diagnosticReportVersionId?: string;

  /**
   * Identificador asociado a imaging study.
   */
  @Property({ fieldName: 'imaging_study_id', type: 'uuid', nullable: true }) // FK → diagnostics.imaging_studies
  imagingStudyId?: string;

  /**
   * Identificador asociado a action concept.
   */
  @Property({ fieldName: 'action_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  actionConceptId!: string;

  /**
   * Identificador asociado a patient visibility concept.
   */
  @Property({ fieldName: 'patient_visibility_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  patientVisibilityConceptId!: string;

  /**
   * Identificador asociado a reason concept.
   */
  @Property({ fieldName: 'reason_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  reasonConceptId?: string;

  /**
   * Valor de policy version mantenido por la instancia.
   */
  @Property({
    fieldName: 'policy_version',
    columnType: 'varchar',
    nullable: true,
  })
  policyVersion?: string;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({ fieldName: 'recorded_at', columnType: 'timestamptz' })
  recordedAt!: Date;

  /**
   * Identificador asociado a recorded by user.
   */
  @Property({ fieldName: 'recorded_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  recordedByUserId?: string;
}
