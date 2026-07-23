import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

@Entity({ schema: 'clinical', tableName: 'procedures' })
export class Procedures {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ fieldName: 'custodian_tenant_id', type: 'uuid' }) // FK → directory.tenants
  custodianTenantId!: string;

  @Property({ fieldName: 'patient_profile_id', type: 'uuid' }) // FK → profiles.patient_profiles
  patientProfileId!: string;

  @Property({ fieldName: 'encounter_id', type: 'uuid', nullable: true }) // FK → clinical.encounters
  encounterId?: string;

  @Property({ fieldName: 'code_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  codeConceptId!: string;

  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  @Property({ fieldName: 'performer_profile_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  performerProfileId?: string;

  @Property({
    fieldName: 'performed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  performedAt?: Date;

  @Property({ fieldName: 'note_text', columnType: 'text', nullable: true })
  noteText?: string;

  @Property({ fieldName: 'service_request_id', type: 'uuid', nullable: true }) // FK → clinical.service_requests
  serviceRequestId?: string;

  @Property({ fieldName: 'parent_procedure_id', type: 'uuid', nullable: true }) // FK → clinical.procedures
  parentProcedureId?: string;

  @Property({ fieldName: 'category_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  categoryConceptId?: string;

  @Property({
    fieldName: 'status_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  statusReasonConceptId?: string;

  @Property({ fieldName: 'practice_site_id', type: 'uuid', nullable: true }) // FK → practice.practice_sites
  practiceSiteId?: string;

  @Property({ fieldName: 'care_space_id', type: 'uuid', nullable: true }) // FK → practice.care_spaces
  careSpaceId?: string;

  @Property({ fieldName: 'recorder_profile_id', type: 'uuid', nullable: true }) // FK (destino no resuelto)
  recorderProfileId?: string;

  @Property({ fieldName: 'outcome_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  outcomeConceptId?: string;

  @Property({
    fieldName: 'reported_source_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  reportedSourceConceptId?: string;

  @Property({
    fieldName: 'occurrence_start_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  occurrenceStartAt?: Date;

  @Property({
    fieldName: 'occurrence_end_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  occurrenceEndAt?: Date;

  @Property({
    fieldName: 'recorded_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  recordedAt?: Date;

  @Property({ fieldName: 'follow_up_text', columnType: 'text', nullable: true })
  followUpText?: string;

  @Property({
    fieldName: 'operative_report_file_id',
    type: 'uuid',
    nullable: true,
  }) // FK → common.files
  operativeReportFileId?: string;

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
