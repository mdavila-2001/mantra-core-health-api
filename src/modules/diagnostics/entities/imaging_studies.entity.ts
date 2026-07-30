import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `imaging_studies`.
 */
@Entity({ schema: 'diagnostics', tableName: 'imaging_studies' })
export class ImagingStudies {
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
   * Identificador asociado a service request.
   */
  @Property({ fieldName: 'service_request_id', type: 'uuid', nullable: true }) // FK → clinical.service_requests
  serviceRequestId?: string;

  /**
   * Identificador asociado a diagnostic report.
   */
  @Property({ fieldName: 'diagnostic_report_id', type: 'uuid', nullable: true }) // FK → clinical.diagnostic_reports
  diagnosticReportId?: string;

  /**
   * Identificador asociado a imaging endpoint.
   */
  @Property({ fieldName: 'imaging_endpoint_id', type: 'uuid' }) // FK → diagnostics.imaging_endpoints
  imagingEndpointId!: string;

  /**
   * Valor de dicom study instance uid mantenido por la instancia.
   */
  @Property({ fieldName: 'dicom_study_instance_uid', columnType: 'varchar' })
  dicomStudyInstanceUid!: string;

  /**
   * Valor de accession number mantenido por la instancia.
   */
  @Property({
    fieldName: 'accession_number',
    columnType: 'varchar',
    nullable: true,
  })
  accessionNumber?: string;

  /**
   * Identificador asociado a modality value set.
   */
  @Property({
    fieldName: 'modality_value_set_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.value_sets
  modalityValueSetId?: string;

  /**
   * Identificador asociado a body site concept.
   */
  @Property({ fieldName: 'body_site_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  bodySiteConceptId?: string;

  /**
   * Identificador asociado a reason concept.
   */
  @Property({ fieldName: 'reason_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  reasonConceptId?: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Valor de started at mantenido por la instancia.
   */
  @Property({
    fieldName: 'started_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startedAt?: Date;

  /**
   * Valor de number of series mantenido por la instancia.
   */
  @Property({
    fieldName: 'number_of_series',
    columnType: 'int',
    nullable: true,
  })
  numberOfSeries?: number;

  /**
   * Valor de number of instances mantenido por la instancia.
   */
  @Property({
    fieldName: 'number_of_instances',
    columnType: 'int',
    nullable: true,
  })
  numberOfInstances?: number;

  /**
   * Identificador asociado a referring practitioner profile.
   */
  @Property({
    fieldName: 'referring_practitioner_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK → profiles.health_practitioner_profiles
  referringPractitionerProfileId?: string;

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
