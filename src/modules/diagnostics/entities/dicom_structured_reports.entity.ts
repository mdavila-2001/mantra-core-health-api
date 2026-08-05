import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `dicom_structured_reports`.
 */
@Entity({ schema: 'diagnostics', tableName: 'dicom_structured_reports' })
export class DicomStructuredReports {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a imaging study.
   */
  @Property({ fieldName: 'imaging_study_id', type: 'uuid' }) // FK → diagnostics.imaging_studies
  imagingStudyId!: string;

  /**
   * Identificador asociado a imaging instance.
   */
  @Property({ fieldName: 'imaging_instance_id', type: 'uuid', nullable: true }) // FK → diagnostics.imaging_instances
  imagingInstanceId?: string;

  /**
   * Valor de sop instance uid mantenido por la instancia.
   */
  @Property({ fieldName: 'sop_instance_uid', columnType: 'varchar' })
  sopInstanceUid!: string;

  /**
   * Identificador asociado a document title concept.
   */
  @Property({ fieldName: 'document_title_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  documentTitleConceptId!: string;

  /**
   * Identificador asociado a diagnostic report.
   */
  @Property({ fieldName: 'diagnostic_report_id', type: 'uuid', nullable: true }) // FK → clinical.diagnostic_reports
  diagnosticReportId?: string;

  /**
   * Identificador asociado a file.
   */
  @Property({ fieldName: 'file_id', type: 'uuid', nullable: true }) // FK → common.files
  fileId?: string;

  /**
   * Valor de content hash mantenido por la instancia.
   */
  @Property({ fieldName: 'content_hash', columnType: 'varchar' })
  contentHash!: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Identificador asociado a verified by profile.
   */
  @Property({
    fieldName: 'verified_by_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK → profiles.health_practitioner_profiles
  verifiedByProfileId?: string;

  /**
   * Valor de verified at mantenido por la instancia.
   */
  @Property({
    fieldName: 'verified_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  verifiedAt?: Date;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @Property({ fieldName: 'created_at', columnType: 'timestamptz' })
  createdAt!: Date;

  /**
   * Fecha y hora de la última actualización.
   */
  @Property({ fieldName: 'updated_at', columnType: 'timestamptz' })
  updatedAt!: Date;

  /**
   * Identificador asociado a created by user.
   */
  @Property({ fieldName: 'created_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  createdByUserId?: string;

  /**
   * Identificador asociado a updated by user.
   */
  @Property({ fieldName: 'updated_by_user_id', type: 'uuid', nullable: true }) // FK → iam.users
  updatedByUserId?: string;

  /**
   * Versión usada para controlar actualizaciones concurrentes.
   */
  @Property({ fieldName: 'row_version', columnType: 'int', version: true })
  rowVersion!: number;
}
