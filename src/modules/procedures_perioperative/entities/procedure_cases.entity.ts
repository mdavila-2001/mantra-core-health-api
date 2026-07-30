import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { randomUUID } from 'node:crypto';

/**
 * Mapea la entidad persistente asociada a `procedure_cases`.
 */
@Entity({ schema: 'procedures_perioperative', tableName: 'procedure_cases' })
export class ProcedureCases {
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
   * Identificador asociado a service request.
   */
  @Property({ fieldName: 'service_request_id', type: 'uuid', nullable: true }) // FK → clinical.service_requests
  serviceRequestId?: string;

  /**
   * Identificador asociado a primary procedure.
   */
  @Property({ fieldName: 'primary_procedure_id', type: 'uuid', nullable: true }) // FK → clinical.procedures
  primaryProcedureId?: string;

  /**
   * Valor de case number mantenido por la instancia.
   */
  @Property({ fieldName: 'case_number', columnType: 'varchar' })
  caseNumber!: string;

  /**
   * Identificador asociado a case type concept.
   */
  @Property({ fieldName: 'case_type_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  caseTypeConceptId!: string;

  /**
   * Identificador asociado a priority concept.
   */
  @Property({ fieldName: 'priority_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  priorityConceptId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @Property({ fieldName: 'status_concept_id', type: 'uuid' }) // FK → terminology.catalog_concepts
  statusConceptId!: string;

  /**
   * Identificador asociado a surgical specialty concept.
   */
  @Property({
    fieldName: 'surgical_specialty_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  surgicalSpecialtyConceptId?: string;

  /**
   * Identificador asociado a requested by profile.
   */
  @Property({
    fieldName: 'requested_by_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK → profiles.health_practitioner_profiles
  requestedByProfileId?: string;

  /**
   * Identificador asociado a primary surgeon profile.
   */
  @Property({
    fieldName: 'primary_surgeon_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK → profiles.health_practitioner_profiles
  primarySurgeonProfileId?: string;

  /**
   * Identificador asociado a anesthesiologist profile.
   */
  @Property({
    fieldName: 'anesthesiologist_profile_id',
    type: 'uuid',
    nullable: true,
  }) // FK → profiles.health_practitioner_profiles
  anesthesiologistProfileId?: string;

  /**
   * Identificador asociado a practice site.
   */
  @Property({ fieldName: 'practice_site_id', type: 'uuid', nullable: true }) // FK → practice.practice_sites
  practiceSiteId?: string;

  /**
   * Identificador asociado a operating room.
   */
  @Property({ fieldName: 'operating_room_id', type: 'uuid', nullable: true }) // FK → practice.care_spaces
  operatingRoomId?: string;

  /**
   * Valor de scheduled start at mantenido por la instancia.
   */
  @Property({
    fieldName: 'scheduled_start_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  scheduledStartAt?: Date;

  /**
   * Valor de scheduled end at mantenido por la instancia.
   */
  @Property({
    fieldName: 'scheduled_end_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  scheduledEndAt?: Date;

  /**
   * Valor de actual start at mantenido por la instancia.
   */
  @Property({
    fieldName: 'actual_start_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  actualStartAt?: Date;

  /**
   * Valor de actual end at mantenido por la instancia.
   */
  @Property({
    fieldName: 'actual_end_at',
    columnType: 'timestamptz',
    nullable: true,
  })
  actualEndAt?: Date;

  /**
   * Identificador asociado a cancellation reason concept.
   */
  @Property({
    fieldName: 'cancellation_reason_concept_id',
    type: 'uuid',
    nullable: true,
  }) // FK → terminology.catalog_concepts
  cancellationReasonConceptId?: string;

  /**
   * Valor de urgency reason text mantenido por la instancia.
   */
  @Property({
    fieldName: 'urgency_reason_text',
    columnType: 'text',
    nullable: true,
  })
  urgencyReasonText?: string;

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
