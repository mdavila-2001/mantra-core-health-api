import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `procedures`.
 */
@Entity({ schema: 'clinical', tableName: 'procedures' })
export class Procedures {
  /**
   * Identificador único de la instancia.
   */
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  /**
   * Identificador asociado a custodian tenant.
   */
  @Property({ fieldName: 'custodian_tenant_id', type: 'uuid' }) // FK → directory.tenants
  custodianTenantId!: string;

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
   * Identificador asociado a code concept.
   */
  @Property({ fieldName: 'code_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  codeConceptId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Identificador asociado a performer profile.
   */
  @Property({ fieldName: 'performer_profile_id', type: 'uuid', nullable: true }) // FK → profiles.health_practitioner_profiles
  performerProfileId?: string;

  /**
   * Valor de performed at mantenido por la instancia.
   */
  @Property({
    fieldName: 'performed_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  performedAt?: Date;

  /**
   * Valor de note text mantenido por la instancia.
   */
  @Property({ fieldName: 'note_text', columnType: 'text', nullable: true })
  noteText?: string;

  /**
   * Identificador asociado a service request.
   */
  @Property({ fieldName: 'service_request_id', type: 'uuid', nullable: true }) // FK → clinical.service_requests
  serviceRequestId?: string;

  /**
   * Identificador asociado a parent procedure.
   */
  @Property({ fieldName: 'parent_procedure_id', type: 'uuid', nullable: true }) // FK → clinical.procedures
  parentProcedureId?: string;

  /**
   * Identificador asociado a category concept.
   */
  @Property({ fieldName: 'category_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  categoryConceptId?: string;

  /**
   * Identificador asociado a status reason concept.
   */
  @Property({
    fieldName: 'status_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  statusReasonConceptId?: string;

  /**
   * Identificador asociado a practice site.
   */
  @Property({ fieldName: 'practice_site_id', type: 'uuid', nullable: true }) // FK → practice.practice_sites
  practiceSiteId?: string;

  /**
   * Identificador asociado a care space.
   */
  @Property({ fieldName: 'care_space_id', type: 'uuid', nullable: true }) // FK → practice.care_spaces
  careSpaceId?: string;

  /**
   * Identificador asociado a recorder profile.
   */
  @Property({ fieldName: 'recorder_profile_id', type: 'uuid', nullable: true }) // FK → profiles.health_practitioner_profiles
  recorderProfileId?: string;

  /**
   * Identificador asociado a outcome concept.
   */
  @Property({ fieldName: 'outcome_concept_id', type: 'uuid', nullable: true }) // FK → terminology.catalog_concepts
  outcomeConceptId?: string;

  /**
   * Identificador asociado a reported source concept.
   */
  @Property({
    fieldName: 'reported_source_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  reportedSourceConceptId?: string;

  /**
   * Valor de occurrence start at mantenido por la instancia.
   */
  @Property({
    fieldName: 'occurrence_start_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  occurrenceStartAt?: Date;

  /**
   * Valor de occurrence end at mantenido por la instancia.
   */
  @Property({
    fieldName: 'occurrence_end_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  occurrenceEndAt?: Date;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @Property({
    fieldName: 'recorded_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  recordedAt?: Date;

  /**
   * Valor de follow up text mantenido por la instancia.
   */
  @Property({ fieldName: 'follow_up_text', columnType: 'text', nullable: true })
  followUpText?: string;

  /**
   * Identificador asociado a operative report file.
   */
  @Property({
    fieldName: 'operative_report_file_id',
    type: 'uuid',
    nullable: true,
  }) // FK → common.files
  operativeReportFileId?: string;

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
