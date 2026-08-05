import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `clinical_media`.
 */
@Entity({ schema: 'diagnostics', tableName: 'clinical_media' })
export class ClinicalMedia {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a patient profile.
   */
  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  /**
   * Identificador asociado a encounter.
   */
  @Property({ fieldName: 'encounter_id', type: 'uuid', nullable: true }) // FK → clinical.encounters
  encounterId?: string;

  /**
   * Identificador asociado a diagnostic report.
   */
  @Property({ fieldName: 'diagnostic_report_id', type: 'uuid', nullable: true }) // FK → clinical.diagnostic_reports
  diagnosticReportId?: string;

  /**
   * Identificador asociado a media type concept.
   */
  @Property({ fieldName: 'media_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  mediaTypeConceptId!: string;

  /**
   * Identificador asociado a body site concept.
   */
  @Property({ fieldName: 'body_site_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  bodySiteConceptId?: string;

  /**
   * Identificador asociado a view concept.
   */
  @Property({ fieldName: 'view_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  viewConceptId?: string;

  /**
   * Identificador asociado a file.
   */
  @Property({ fieldName: 'file_id', type: 'uuid' }) // FK → common.files
  fileId!: string;

  /**
   * Valor de captured at mantenido por la instancia.
   */
  @Property({
    fieldName: 'captured_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  capturedAt?: Date;

  /**
   * Identificador asociado a captured by profile.
   */
  @Property({
    fieldName: 'captured_by_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK → profiles.health_practitioner_profiles
  capturedByProfileId?: string;

  /**
   * Identificador asociado a device.
   */
  @Property({ fieldName: 'device_id', type: 'uuid', nullable: true }) // FK → iam.devices
  deviceId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Identificador asociado a patient visibility concept.
   */
  @Property({
    fieldName: 'patient_visibility_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  patientVisibilityConceptId?: string;

  /**
   * Identificador asociado a custodian tenant.
   */
  @Property({ fieldName: 'custodian_tenant_id', type: 'uuid' }) // FK → directory.tenants
  custodianTenantId!: string;

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
