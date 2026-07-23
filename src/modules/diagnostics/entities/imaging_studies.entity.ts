import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'diagnostics', tableName: 'imaging_studies' })
export class ImagingStudies {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  @Property({ fieldName: 'encounter_id', type: 'uuid', nullable: true }) // FK → clinical.encounters
  encounterId?: string;

  @Property({ fieldName: 'service_request_id', type: 'uuid', nullable: true }) // FK → clinical.service_requests
  serviceRequestId?: string;

  @Property({ fieldName: 'diagnostic_report_id', type: 'uuid', nullable: true }) // FK → clinical.diagnostic_reports
  diagnosticReportId?: string;

  @Property({ fieldName: 'imaging_endpoint_id', type: 'uuid' }) // FK → diagnostics.imaging_endpoints
  imagingEndpointId!: string;

  @Property({ fieldName: 'dicom_study_instance_uid', columnType: 'varchar' })
  dicomStudyInstanceUid!: string;

  @Property({
    fieldName: 'accession_number',
    columnType: 'varchar',
    nullable: true,
  })
  accessionNumber?: string;

  @Property({
    fieldName: 'modality_value_set_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.value_sets
  modalityValueSetId?: string;

  @Property({ fieldName: 'body_site_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  bodySiteConceptId?: string;

  @Property({ fieldName: 'reason_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  reasonConceptId?: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({
    fieldName: 'started_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  startedAt?: Date;

  @Property({
    fieldName: 'number_of_series',
    columnType: 'int',
    nullable: true,
  })
  numberOfSeries?: number;

  @Property({
    fieldName: 'number_of_instances',
    columnType: 'int',
    nullable: true,
  })
  numberOfInstances?: number;

  @Property({
    fieldName: 'referring_practitioner_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK (destino no resuelto)
  referringPractitionerProfileId?: string;

  @Property({ fieldName: 'custodian_tenant_id', type: 'uuid' }) // FK → directory.tenants
  custodianTenantId!: string;

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
